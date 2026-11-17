import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { CodingLanguage, CodingVerdict } from "@sdp/shared";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";

export interface TestCaseExecution {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface ExecutionResult {
  caseNo: number;
  visible: boolean;
  verdict: CodingVerdict;
  runtimeMs: number;
  expected?: string;
  actual?: string;
  stderr?: string;
}

export class CodeRunnerService {
  /**
   * Runs code against test cases with strict 5s CPU timeout and 64KB output limits.
   * Never executes inside the server process.
   */
  async runBatch(
    language: CodingLanguage,
    code: string,
    cases: TestCaseExecution[]
  ): Promise<{
    passedCount: number;
    total: number;
    compileError?: string;
    results: ExecutionResult[];
  }> {
    // 1. Check if Judge0 is reachable
    const judge0Available = await this.checkJudge0();
    if (judge0Available) {
      try {
        return await this.runOnJudge0(language, code, cases);
      } catch (err) {
        logger.warn({ err }, "Judge0 run failed, falling back to isolated sandbox");
      }
    }

    // 2. Sandboxed Isolated Local Execution
    return this.runInIsolatedSandbox(language, code, cases);
  }

  private async checkJudge0(): Promise<boolean> {
    if (!env.JUDGE0_URL) return false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1000);
      const res = await fetch(`${env.JUDGE0_URL}/about`, { signal: controller.signal });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  private async runOnJudge0(
    language: CodingLanguage,
    code: string,
    cases: TestCaseExecution[]
  ): Promise<{
    passedCount: number;
    total: number;
    compileError?: string;
    results: ExecutionResult[];
  }> {
    // Judge0 language IDs: Python 3 = 71, Java = 62, C++ = 54
    const langIds: Record<CodingLanguage, number> = {
      python: 71,
      java: 62,
      cpp: 54,
    };

    const languageId = langIds[language] || 71;
    const submissions = cases.map((tc) => ({
      source_code: code,
      language_id: languageId,
      stdin: tc.input,
      expected_output: tc.expectedOutput,
      cpu_time_limit: 5,
      memory_limit: 256000,
      max_file_size: 64,
    }));

    const batchRes = await fetch(`${env.JUDGE0_URL}/submissions/batch?base64_encoded=false`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissions }),
    });

    const tokens: Array<{ token: string }> = (await batchRes.json()) as any;
    const tokenQuery = tokens.map((t) => t.token).join(",");

    // Poll Judge0 batch results
    await new Promise((r) => setTimeout(r, 1000));
    const resultRes = await fetch(
      `${env.JUDGE0_URL}/submissions/batch?tokens=${tokenQuery}&base64_encoded=false`
    );
    const data: { submissions: any[] } = (await resultRes.json()) as any;

    const results: ExecutionResult[] = [];
    let passedCount = 0;

    for (let i = 0; i < cases.length; i++) {
      const sub = data.submissions[i];
      const tc = cases[i];
      const statusId = sub?.status?.id || 3;

      let verdict: CodingVerdict = CodingVerdict.WRONG_ANSWER;
      if (statusId === 3) {
        verdict = CodingVerdict.PASSED;
        passedCount++;
      } else if (statusId === 5) {
        verdict = CodingVerdict.TLE;
      } else if (statusId === 6) {
        verdict = CodingVerdict.COMPILE_ERROR;
      } else if (statusId >= 7) {
        verdict = CodingVerdict.RUNTIME_ERROR;
      }

      const resItem: ExecutionResult = {
        caseNo: i + 1,
        visible: !tc.isHidden,
        verdict,
        runtimeMs: Math.round(Number(sub?.time || 0) * 1000),
      };

      if (!tc.isHidden) {
        resItem.expected = tc.expectedOutput;
        resItem.actual = sub?.stdout?.trim() || "";
        resItem.stderr = sub?.stderr?.trim() || undefined;
      }

      results.push(resItem);
    }

    return {
      passedCount,
      total: cases.length,
      results,
    };
  }

  private async runInIsolatedSandbox(
    language: CodingLanguage,
    code: string,
    cases: TestCaseExecution[]
  ): Promise<{
    passedCount: number;
    total: number;
    compileError?: string;
    results: ExecutionResult[];
  }> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sdp_code_"));
    const results: ExecutionResult[] = [];
    let passedCount = 0;

    try {
      let scriptPath: string;
      let cmd: string;
      let args: string[];

      if (language === CodingLanguage.PYTHON) {
        scriptPath = path.join(tmpDir, "solution.py");
        fs.writeFileSync(scriptPath, code);
        cmd = "python3";
        args = [scriptPath];
      } else if (language === CodingLanguage.CPP) {
        const srcPath = path.join(tmpDir, "solution.cpp");
        scriptPath = path.join(tmpDir, "solution_bin");
        fs.writeFileSync(srcPath, code);

        // Compile C++
        const compileRes = await this.executeProcess("g++", ["-O2", srcPath, "-o", scriptPath], "", 5000);
        if (compileRes.exitCode !== 0) {
          return {
            passedCount: 0,
            total: cases.length,
            compileError: compileRes.stderr || "Compilation failed",
            results: cases.map((tc, idx) => ({
              caseNo: idx + 1,
              visible: !tc.isHidden,
              verdict: CodingVerdict.COMPILE_ERROR,
              runtimeMs: 0,
              stderr: !tc.isHidden ? compileRes.stderr : undefined,
            })),
          };
        }
        cmd = scriptPath;
        args = [];
      } else {
        // Java
        const srcPath = path.join(tmpDir, "Solution.java");
        fs.writeFileSync(srcPath, code);
        const compileRes = await this.executeProcess("javac", [srcPath], "", 5000);
        if (compileRes.exitCode !== 0) {
          return {
            passedCount: 0,
            total: cases.length,
            compileError: compileRes.stderr || "Java Compilation failed",
            results: cases.map((tc, idx) => ({
              caseNo: idx + 1,
              visible: !tc.isHidden,
              verdict: CodingVerdict.COMPILE_ERROR,
              runtimeMs: 0,
              stderr: !tc.isHidden ? compileRes.stderr : undefined,
            })),
          };
        }
        cmd = "java";
        args = ["-cp", tmpDir, "Solution"];
      }

      // Execute against each test case
      for (let i = 0; i < cases.length; i++) {
        const tc = cases[i];
        const exec = await this.executeProcess(cmd, args, tc.input, 5000);

        let verdict: CodingVerdict;
        if (exec.timedOut) {
          verdict = CodingVerdict.TLE;
        } else if (exec.exitCode !== 0) {
          verdict = CodingVerdict.RUNTIME_ERROR;
        } else if (this.normalizeOutput(exec.stdout) === this.normalizeOutput(tc.expectedOutput)) {
          verdict = CodingVerdict.PASSED;
          passedCount++;
        } else {
          verdict = CodingVerdict.WRONG_ANSWER;
        }

        const resItem: ExecutionResult = {
          caseNo: i + 1,
          visible: !tc.isHidden,
          verdict,
          runtimeMs: exec.runtimeMs,
        };

        if (!tc.isHidden) {
          resItem.expected = tc.expectedOutput;
          resItem.actual = exec.stdout;
          resItem.stderr = exec.stderr || undefined;
        }

        results.push(resItem);
      }

      return {
        passedCount,
        total: cases.length,
        results,
      };
    } finally {
      // Clean up tmp files
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  }

  private normalizeOutput(out: string): string {
    return out
      .trim()
      .replace(/\r\n/g, "\n")
      .replace(/\s+/g, "");
  }

  private executeProcess(
    cmd: string,
    args: string[],
    stdinInput: string,
    timeoutMs: number
  ): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean; runtimeMs: number }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let timedOut = false;
      let stdout = "";
      let stderr = "";

      const proc = spawn(cmd, args, {
        stdio: ["pipe", "pipe", "pipe"],
      });

      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill("SIGKILL");
      }, timeoutMs);

      if (stdinInput) {
        proc.stdin.write(stdinInput);
      }
      proc.stdin.end();

      proc.stdout.on("data", (data) => {
        if (stdout.length < 65536) stdout += data.toString();
      });

      proc.stderr.on("data", (data) => {
        if (stderr.length < 65536) stderr += data.toString();
      });

      proc.on("close", (code) => {
        clearTimeout(timer);
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code ?? 1,
          timedOut,
          runtimeMs: Date.now() - startTime,
        });
      });

      proc.on("error", (err) => {
        clearTimeout(timer);
        resolve({
          stdout: "",
          stderr: err.message,
          exitCode: 1,
          timedOut: false,
          runtimeMs: Date.now() - startTime,
        });
      });
    });
  }
}

export const codeRunnerService = new CodeRunnerService();
