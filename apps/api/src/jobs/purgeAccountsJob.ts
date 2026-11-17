import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

/**
 * Permanently purges user accounts marked for deletion > 30 days ago (FR-4 / §3.4).
 * Cascading relations (Sessions, Answers, Attempts, Reports, Tokens) are cleaned up by Postgres.
 */
export async function purgeDeletedAccounts(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const result = await prisma.user.deleteMany({
      where: {
        markedForDeletionAt: {
          not: null,
          lte: thirtyDaysAgo,
        },
      },
    });

    if (result.count > 0) {
      logger.info({ purgedCount: result.count }, "Purged expired deleted accounts");
    }

    return result.count;
  } catch (err) {
    logger.error({ err }, "Failed to execute purgeDeletedAccounts job");
    return 0;
  }
}
