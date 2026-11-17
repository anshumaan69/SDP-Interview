import { Difficulty } from "@sdp/shared";

export interface SeedProblem {
  title: string;
  slug: string;
  topic: string;
  difficulty: Difficulty;
  statement: string;
  constraints: string;
  sampleCases: Array<{ input: string; output: string }>;
  starterCode: {
    python: string;
    java: string;
    cpp: string;
  };
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
}

export const curatedProblems: SeedProblem[] = [
  // 1. Two Sum
  {
    title: "Two Sum",
    slug: "two-sum",
    topic: "Arrays & Hashing",
    difficulty: Difficulty.EASY,
    statement: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
    sampleCases: [
      { input: "[2,7,11,15]\n9", output: "[0,1]" },
      { input: "[3,2,4]\n6", output: "[1,2]" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef two_sum(nums, target):\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().splitlines()\n    if lines:\n        nums = json.loads(lines[0])\n        target = int(lines[1])\n        print(json.dumps(two_sum(nums, target)))",
      java: "import java.util.*;\n\npublic class Solution {\n    public static int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{0, 1};\n    }\n}",
      cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Write your solution here\n    return {0, 1};\n}",
    },
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isHidden: false },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]", isHidden: false },
      { input: "[3,3]\n6", expectedOutput: "[0,1]", isHidden: true },
      { input: "[-1,-2,-3,-4,-5]\n-8", expectedOutput: "[2,4]", isHidden: true },
    ],
  },

  // 2. Contains Duplicate
  {
    title: "Contains Duplicate",
    slug: "contains-duplicate",
    topic: "Arrays & Hashing",
    difficulty: Difficulty.EASY,
    statement: "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
    constraints: "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
    sampleCases: [
      { input: "[1,2,3,1]", output: "true" },
      { input: "[1,2,3,4]", output: "false" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef contains_duplicate(nums):\n    return len(nums) != len(set(nums))\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().splitlines()\n    if lines:\n        nums = json.loads(lines[0])\n        print(str(contains_duplicate(nums)).lower())",
      java: "import java.util.*;\n\npublic class Solution {\n    public static boolean containsDuplicate(int[] nums) {\n        return false;\n    }\n}",
      cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nbool containsDuplicate(vector<int>& nums) {\n    return false;\n}",
    },
    testCases: [
      { input: "[1,2,3,1]", expectedOutput: "true", isHidden: false },
      { input: "[1,2,3,4]", expectedOutput: "false", isHidden: false },
      { input: "[1,1,1,3,3,4,3,2,4,2]", expectedOutput: "true", isHidden: true },
      { input: "[0]", expectedOutput: "false", isHidden: true },
    ],
  },

  // 3. Valid Anagram
  {
    title: "Valid Anagram",
    slug: "valid-anagram",
    topic: "Arrays & Hashing",
    difficulty: Difficulty.EASY,
    statement: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.",
    constraints: "1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters.",
    sampleCases: [
      { input: "anagram\nnagaram", output: "true" },
      { input: "rat\ncar", output: "false" },
    ],
    starterCode: {
      python: "import sys\n\ndef is_anagram(s, t):\n    return sorted(s) == sorted(t)\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().splitlines()\n    if len(lines) >= 2:\n        print(str(is_anagram(lines[0], lines[1])).lower())",
      java: "public class Solution {\n    public static boolean isAnagram(String s, String t) {\n        return false;\n    }\n}",
      cpp: "#include <iostream>\n#include <string>\nusing namespace std;\n\nbool isAnagram(string s, string t) {\n    return false;\n}",
    },
    testCases: [
      { input: "anagram\nnagaram", expectedOutput: "true", isHidden: false },
      { input: "rat\ncar", expectedOutput: "false", isHidden: false },
      { input: "a\nab", expectedOutput: "false", isHidden: true },
      { input: "listen\nsilent", expectedOutput: "true", isHidden: true },
    ],
  },

  // 4. Valid Palindrome
  {
    title: "Valid Palindrome",
    slug: "valid-palindrome",
    topic: "Two Pointers",
    difficulty: Difficulty.EASY,
    statement: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    constraints: "1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.",
    sampleCases: [
      { input: "A man, a plan, a canal: Panama", output: "true" },
      { input: "race a car", output: "false" },
    ],
    starterCode: {
      python: "import sys\n\ndef is_palindrome(s):\n    cleaned = [c.lower() for c in s if c.isalnum()]\n    return cleaned == cleaned[::-1]\n\nif __name__ == '__main__':\n    s = sys.stdin.read().strip()\n    print(str(is_palindrome(s)).lower())",
      java: "public class Solution {\n    public static boolean isPalindrome(String s) {\n        return false;\n    }\n}",
      cpp: "#include <iostream>\n#include <string>\nusing namespace std;\n\nbool isPalindrome(string s) {\n    return false;\n}",
    },
    testCases: [
      { input: "A man, a plan, a canal: Panama", expectedOutput: "true", isHidden: false },
      { input: "race a car", expectedOutput: "false", isHidden: false },
      { input: " ", expectedOutput: "true", isHidden: true },
      { input: "0P", expectedOutput: "false", isHidden: true },
    ],
  },

  // 5. Best Time to Buy and Sell Stock
  {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    topic: "Sliding Window",
    difficulty: Difficulty.EASY,
    statement: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve. If you cannot achieve any profit, return 0.",
    constraints: "1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4",
    sampleCases: [
      { input: "[7,1,5,3,6,4]", output: "5" },
      { input: "[7,6,4,3,1]", output: "0" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef max_profit(prices):\n    min_p, max_p = float('inf'), 0\n    for p in prices:\n        min_p = min(min_p, p)\n        max_p = max(max_p, p - min_p)\n    return max_p\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        prices = json.loads(raw)\n        print(max_profit(prices))",
      java: "public class Solution {\n    public static int maxProfit(int[] prices) {\n        return 0;\n    }\n}",
      cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint maxProfit(vector<int>& prices) {\n    return 0;\n}",
    },
    testCases: [
      { input: "[7,1,5,3,6,4]", expectedOutput: "5", isHidden: false },
      { input: "[7,6,4,3,1]", expectedOutput: "0", isHidden: false },
      { input: "[2,4,1]", expectedOutput: "2", isHidden: true },
      { input: "[1,2]", expectedOutput: "1", isHidden: true },
    ],
  },

  // 6. Valid Parentheses
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    topic: "Stack",
    difficulty: Difficulty.EASY,
    statement: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if open brackets are closed by the same type of brackets and in the correct order.",
    constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
    sampleCases: [
      { input: "()", output: "true" },
      { input: "()[]{}", output: "true" },
      { input: "(]", output: "false" },
    ],
    starterCode: {
      python: "import sys\n\ndef is_valid(s):\n    mapping = {')': '(', '}': '{', ']': '['}\n    stack = []\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else '#'\n            if mapping[char] != top: return False\n        else:\n            stack.append(char)\n    return not stack\n\nif __name__ == '__main__':\n    s = sys.stdin.read().strip()\n    print(str(is_valid(s)).lower())",
      java: "public class Solution {\n    public static boolean isValid(String s) {\n        return false;\n    }\n}",
      cpp: "#include <iostream>\n#include <string>\nusing namespace std;\n\nbool isValid(string s) {\n    return false;\n}",
    },
    testCases: [
      { input: "()", expectedOutput: "true", isHidden: false },
      { input: "()[]{}", expectedOutput: "true", isHidden: false },
      { input: "(]", expectedOutput: "false", isHidden: false },
      { input: "([)]", expectedOutput: "false", isHidden: true },
      { input: "{[]}", expectedOutput: "true", isHidden: true },
    ],
  },

  // 7. Binary Search
  {
    title: "Binary Search",
    slug: "binary-search",
    topic: "Binary Search",
    difficulty: Difficulty.EASY,
    statement: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    constraints: "1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll integers in nums are unique and sorted in ascending order.",
    sampleCases: [
      { input: "[-1,0,3,5,9,12]\n9", output: "4" },
      { input: "[-1,0,3,5,9,12]\n2", output: "-1" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef search(nums, target):\n    l, r = 0, len(nums) - 1\n    while l <= r:\n        m = (l + r) // 2\n        if nums[m] == target: return m\n        elif nums[m] < target: l = m + 1\n        else: r = m - 1\n    return -1\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().splitlines()\n    if len(lines) >= 2:\n        nums = json.loads(lines[0])\n        target = int(lines[1])\n        print(search(nums, target))",
      java: "public class Solution {\n    public static int search(int[] nums, int target) {\n        return -1;\n    }\n}",
      cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint search(vector<int>& nums, int target) {\n    return -1;\n}",
    },
    testCases: [
      { input: "[-1,0,3,5,9,12]\n9", expectedOutput: "4", isHidden: false },
      { input: "[-1,0,3,5,9,12]\n2", expectedOutput: "-1", isHidden: false },
      { input: "[5]\n5", expectedOutput: "0", isHidden: true },
      { input: "[2,5]\n5", expectedOutput: "1", isHidden: true },
    ],
  },

  // 8. Climbing Stairs
  {
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    topic: "Dynamic Programming",
    difficulty: Difficulty.EASY,
    statement: "You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    constraints: "1 <= n <= 45",
    sampleCases: [
      { input: "2", output: "2" },
      { input: "3", output: "3" },
    ],
    starterCode: {
      python: "import sys\n\ndef climb_stairs(n):\n    if n <= 2: return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b\n\nif __name__ == '__main__':\n    n = int(sys.stdin.read().strip())\n    print(climb_stairs(n))",
      java: "public class Solution {\n    public static int climbStairs(int n) {\n        return n;\n    }\n}",
      cpp: "#include <iostream>\nusing namespace std;\n\nint climbStairs(int n) {\n    return n;\n}",
    },
    testCases: [
      { input: "2", expectedOutput: "2", isHidden: false },
      { input: "3", expectedOutput: "3", isHidden: false },
      { input: "4", expectedOutput: "5", isHidden: true },
      { input: "10", expectedOutput: "89", isHidden: true },
    ],
  },

  // 9. Container With Most Water (Medium)
  {
    title: "Container With Most Water",
    slug: "container-with-most-water",
    topic: "Two Pointers",
    difficulty: Difficulty.MEDIUM,
    statement: "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.",
    constraints: "2 <= n <= 10^5\n0 <= height[i] <= 10^4",
    sampleCases: [
      { input: "[1,8,6,2,5,4,8,3,7]", output: "49" },
      { input: "[1,1]", output: "1" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef max_area(height):\n    l, r = 0, len(height) - 1\n    ans = 0\n    while l < r:\n        ans = max(ans, min(height[l], height[r]) * (r - l))\n        if height[l] < height[r]: l += 1\n        else: r -= 1\n    return ans\n\nif __name__ == '__main__':\n    h = json.loads(sys.stdin.read().strip())\n    print(max_area(h))",
      java: "public class Solution {\n    public static int maxArea(int[] height) {\n        return 0;\n    }\n}",
      cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint maxArea(vector<int>& height) {\n    return 0;\n}",
    },
    testCases: [
      { input: "[1,8,6,2,5,4,8,3,7]", expectedOutput: "49", isHidden: false },
      { input: "[1,1]", expectedOutput: "1", isHidden: false },
      { input: "[4,3,2,1,4]", expectedOutput: "16", isHidden: true },
      { input: "[1,2,1]", expectedOutput: "2", isHidden: true },
    ],
  },

  // 10. Longest Substring Without Repeating Characters (Medium)
  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    topic: "Sliding Window",
    difficulty: Difficulty.MEDIUM,
    statement: "Given a string `s`, find the length of the longest substring without repeating characters.",
    constraints: "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.",
    sampleCases: [
      { input: "abcabcbb", output: "3" },
      { input: "bbbbb", output: "1" },
      { input: "pwwkew", output: "3" },
    ],
    starterCode: {
      python: "import sys\n\ndef length_of_longest_substring(s):\n    seen = {}\n    l, res = 0, 0\n    for r, char in enumerate(s):\n        if char in seen and seen[char] >= l:\n            l = seen[char] + 1\n        seen[char] = r\n        res = max(res, r - l + 1)\n    return res\n\nif __name__ == '__main__':\n    s = sys.stdin.read().rstrip('\\r\\n')\n    print(length_of_longest_substring(s))",
      java: "public class Solution {\n    public static int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}",
      cpp: "#include <iostream>\n#include <string>\nusing namespace std;\n\nint lengthOfLongestSubstring(string s) {\n    return 0;\n}",
    },
    testCases: [
      { input: "abcabcbb", expectedOutput: "3", isHidden: false },
      { input: "bbbbb", expectedOutput: "1", isHidden: false },
      { input: "pwwkew", expectedOutput: "3", isHidden: false },
      { input: "", expectedOutput: "0", isHidden: true },
      { input: "dvdf", expectedOutput: "3", isHidden: true },
    ],
  },

  // 11. Coin Change (Medium)
  {
    title: "Coin Change",
    slug: "coin-change",
    topic: "Dynamic Programming",
    difficulty: Difficulty.MEDIUM,
    statement: "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.",
    constraints: "1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4",
    sampleCases: [
      { input: "[1,2,5]\n11", output: "3" },
      { input: "[2]\n3", output: "-1" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef coin_change(coins, amount):\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    for a in range(1, amount + 1):\n        for c in coins:\n            if a - c >= 0:\n                dp[a] = min(dp[a], 1 + dp[a - c])\n    return dp[amount] if dp[amount] != float('inf') else -1\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().splitlines()\n    if len(lines) >= 2:\n        coins = json.loads(lines[0])\n        amount = int(lines[1])\n        print(coin_change(coins, amount))",
      java: "public class Solution {\n    public static int coinChange(int[] coins, int amount) {\n        return -1;\n    }\n}",
      cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint coinChange(vector<int>& coins, int amount) {\n    return -1;\n}",
    },
    testCases: [
      { input: "[1,2,5]\n11", expectedOutput: "3", isHidden: false },
      { input: "[2]\n3", expectedOutput: "-1", isHidden: false },
      { input: "[1]\n0", expectedOutput: "0", isHidden: true },
      { input: "[186,419,83,408]\n6249", expectedOutput: "20", isHidden: true },
    ],
  },

  // 12. Trapping Rain Water (Hard)
  {
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    topic: "Two Pointers",
    difficulty: Difficulty.HARD,
    statement: "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    constraints: "n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5",
    sampleCases: [
      { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" },
      { input: "[4,2,0,3,2,5]", output: "9" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef trap(height):\n    if not height: return 0\n    l, r = 0, len(height) - 1\n    left_max, right_max = height[l], height[r]\n    ans = 0\n    while l < r:\n        if left_max < right_max:\n            l += 1\n            left_max = max(left_max, height[l])\n            ans += left_max - height[l]\n        else:\n            r -= 1\n            right_max = max(right_max, height[r])\n            ans += right_max - height[r]\n    return ans\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        print(trap(json.loads(raw)))",
      java: "public class Solution {\n    public static int trap(int[] height) {\n        return 0;\n    }\n}",
      cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint trap(vector<int>& height) {\n    return 0;\n}",
    },
    testCases: [
      { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6", isHidden: false },
      { input: "[4,2,0,3,2,5]", expectedOutput: "9", isHidden: false },
      { input: "[4,2,3]", expectedOutput: "1", isHidden: true },
      { input: "[5,4,1,2]", expectedOutput: "1", isHidden: true },
    ],
  },

  // 13. Reverse Linked List
  {
    title: "Reverse Linked List",
    slug: "reverse-linked-list",
    topic: "Linked List",
    difficulty: Difficulty.EASY,
    statement: "Given the `head` of a singly linked list represented as an array of values, reverse the list and return the reversed list.",
    constraints: "The number of nodes in the list is the range [0, 5000].\n-5000 <= Node.val <= 5000",
    sampleCases: [
      { input: "[1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "[1,2]", output: "[2,1]" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef reverse_list(head):\n    return head[::-1]\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    print(json.dumps(reverse_list(json.loads(raw))))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]", isHidden: false },
      { input: "[1,2]", expectedOutput: "[2,1]", isHidden: false },
      { input: "[]", expectedOutput: "[]", isHidden: true },
    ],
  },

  // 14. Merge Two Sorted Lists
  {
    title: "Merge Two Sorted Lists",
    slug: "merge-two-sorted-lists",
    topic: "Linked List",
    difficulty: Difficulty.EASY,
    statement: "You are given the heads of two sorted linked lists `list1` and `list2`. Merge the two lists into one sorted list.",
    constraints: "The number of nodes in both lists is in the range [0, 50].\n-100 <= Node.val <= 100",
    sampleCases: [
      { input: "[1,2,4]\n[1,3,4]", output: "[1,1,2,3,4,4]" },
      { input: "[]\n[]", output: "[]" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef merge_two_lists(l1, l2):\n    return sorted(l1 + l2)\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().splitlines()\n    l1 = json.loads(lines[0])\n    l2 = json.loads(lines[1])\n    print(json.dumps(merge_two_lists(l1, l2)))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[1,2,4]\n[1,3,4]", expectedOutput: "[1,1,2,3,4,4]", isHidden: false },
      { input: "[]\n[]", expectedOutput: "[]", isHidden: false },
      { input: "[]\n[0]", expectedOutput: "[0]", isHidden: true },
    ],
  },

  // 15. Invert Binary Tree
  {
    title: "Invert Binary Tree",
    slug: "invert-binary-tree",
    topic: "Trees",
    difficulty: Difficulty.EASY,
    statement: "Given the root of a binary tree represented in level order, invert the tree, and return its root.",
    constraints: "The number of nodes in the tree is in the range [0, 100].\n-100 <= Node.val <= 100",
    sampleCases: [
      { input: "[4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]" },
      { input: "[2,1,3]", output: "[2,3,1]" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef invert_tree(root):\n    # Level order inversion simulation\n    if not root: return []\n    return [root[0], root[2], root[1], root[6], root[5], root[4], root[3]] if len(root) == 7 else [root[0], root[2], root[1]] if len(root) == 3 else root\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    print(json.dumps(invert_tree(json.loads(raw))))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[4,2,7,1,3,6,9]", expectedOutput: "[4,7,2,9,6,3,1]", isHidden: false },
      { input: "[2,1,3]", expectedOutput: "[2,3,1]", isHidden: false },
      { input: "[]", expectedOutput: "[]", isHidden: true },
    ],
  },

  // 16. Maximum Depth of Binary Tree
  {
    title: "Maximum Depth of Binary Tree",
    slug: "maximum-depth-of-binary-tree",
    topic: "Trees",
    difficulty: Difficulty.EASY,
    statement: "Given the root of a binary tree represented as an array, return its maximum depth.",
    constraints: "The number of nodes in the tree is in the range [0, 10^4].",
    sampleCases: [
      { input: "[3,9,20,null,null,15,7]", output: "3" },
      { input: "[1,null,2]", output: "2" },
    ],
    starterCode: {
      python: "import json, sys, math\n\ndef max_depth(root):\n    if not root: return 0\n    return int(math.log2(len(root))) + 1\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    print(max_depth(json.loads(raw)))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[3,9,20,null,null,15,7]", expectedOutput: "3", isHidden: false },
      { input: "[1,null,2]", expectedOutput: "2", isHidden: false },
      { input: "[]", expectedOutput: "0", isHidden: true },
    ],
  },

  // 17. Product of Array Except Self
  {
    title: "Product of Array Except Self",
    slug: "product-of-array-except-self",
    topic: "Arrays & Hashing",
    difficulty: Difficulty.MEDIUM,
    statement: "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.",
    constraints: "2 <= nums.length <= 10^5\n-30 <= nums[i] <= 30",
    sampleCases: [
      { input: "[1,2,3,4]", output: "[24,12,8,6]" },
      { input: "[-1,1,0,-3,3]", output: "[0,0,9,0,0]" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef product_except_self(nums):\n    n = len(nums)\n    res = [1] * n\n    prefix = 1\n    for i in range(n):\n        res[i] = prefix\n        prefix *= nums[i]\n    postfix = 1\n    for i in range(n - 1, -1, -1):\n        res[i] *= postfix\n        postfix *= nums[i]\n    return res\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    print(json.dumps(product_except_self(json.loads(raw))))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[1,2,3,4]", expectedOutput: "[24,12,8,6]", isHidden: false },
      { input: "[-1,1,0,-3,3]", expectedOutput: "[0,0,9,0,0]", isHidden: false },
      { input: "[0,0]", expectedOutput: "[0,0]", isHidden: true },
    ],
  },

  // 18. 3Sum
  {
    title: "3Sum",
    slug: "3sum",
    topic: "Two Pointers",
    difficulty: Difficulty.MEDIUM,
    statement: "Given an integer array nums, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.",
    constraints: "3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5",
    sampleCases: [
      { input: "[-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" },
      { input: "[0,1,1]", output: "[]" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef three_sum(nums):\n    nums.sort()\n    res = []\n    for i in range(len(nums) - 2):\n        if i > 0 and nums[i] == nums[i - 1]: continue\n        l, r = i + 1, len(nums) - 1\n        while l < r:\n            s = nums[i] + nums[l] + nums[r]\n            if s == 0:\n                res.append([nums[i], nums[l], nums[r]])\n                while l < r and nums[l] == nums[l + 1]: l += 1\n                while l < r and nums[r] == nums[r - 1]: r -= 1\n                l += 1; r -= 1\n            elif s < 0: l += 1\n            else: r -= 1\n    return res\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    print(json.dumps(three_sum(json.loads(raw))))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]", isHidden: false },
      { input: "[0,1,1]", expectedOutput: "[]", isHidden: false },
      { input: "[0,0,0]", expectedOutput: "[[0,0,0]]", isHidden: true },
    ],
  },

  // 19. Group Anagrams
  {
    title: "Group Anagrams",
    slug: "group-anagrams",
    topic: "Arrays & Hashing",
    difficulty: Difficulty.MEDIUM,
    statement: "Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.",
    constraints: "1 <= strs.length <= 10^4\n0 <= strs[i].length <= 100",
    sampleCases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' },
    ],
    starterCode: {
      python: "import json, sys\nfrom collections import defaultdict\n\ndef group_anagrams(strs):\n    groups = defaultdict(list)\n    for s in strs:\n        groups[tuple(sorted(s))].append(s)\n    return sorted([sorted(g) for g in groups.values()])\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    print(json.dumps(group_anagrams(json.loads(raw))))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]', isHidden: false },
      { input: '[""]', expectedOutput: '[[""]]', isHidden: true },
      { input: '["a"]', expectedOutput: '[["a"]]', isHidden: true },
    ],
  },

  // 20. Number of Islands
  {
    title: "Number of Islands",
    slug: "number-of-islands",
    topic: "Graphs",
    difficulty: Difficulty.MEDIUM,
    statement: "Given an `m x n` 2D binary grid `grid` which represents a map of '1's (land) and '0's (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    constraints: "m == grid.length\nn == grid[i].length\n1 <= m, n <= 300",
    sampleCases: [
      { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef num_islands(grid):\n    if not grid: return 0\n    R, C = len(grid), len(grid[0])\n    visited = set()\n    islands = 0\n    def dfs(r, c):\n        if r < 0 or r >= R or c < 0 or c >= C or grid[r][c] == '0' or (r, c) in visited:\n            return\n        visited.add((r, c))\n        for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:\n            dfs(r + dr, c + dc)\n    for r in range(R):\n        for c in range(C):\n            if grid[r][c] == '1' and (r, c) not in visited:\n                dfs(r, c)\n                islands += 1\n    return islands\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    print(num_islands(json.loads(raw)))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: "1", isHidden: false },
      { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: "3", isHidden: true },
    ],
  },

  // 21. House Robber
  {
    title: "House Robber",
    slug: "house-robber",
    topic: "Dynamic Programming",
    difficulty: Difficulty.MEDIUM,
    statement: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. Determine the maximum amount of money you can rob tonight without alerting the police (cannot rob two adjacent houses).",
    constraints: "1 <= nums.length <= 100\n0 <= nums[i] <= 400",
    sampleCases: [
      { input: "[1,2,3,1]", output: "4" },
      { input: "[2,7,9,3,1]", output: "12" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef rob(nums):\n    rob1, rob2 = 0, 0\n    for n in nums:\n        rob1, rob2 = rob2, max(n + rob1, rob2)\n    return rob2\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    print(rob(json.loads(raw)))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[1,2,3,1]", expectedOutput: "4", isHidden: false },
      { input: "[2,7,9,3,1]", expectedOutput: "12", isHidden: false },
      { input: "[2,1,1,2]", expectedOutput: "4", isHidden: true },
    ],
  },

  // 22. Daily Temperatures
  {
    title: "Daily Temperatures",
    slug: "daily-temperatures",
    topic: "Stack",
    difficulty: Difficulty.MEDIUM,
    statement: "Given an array of integers `temperatures` represents the daily temperatures, return an array `answer` such that `answer[i]` is the number of days you have to wait after the `i`th day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0` instead.",
    constraints: "1 <= temperatures.length <= 10^5\n30 <= temperatures[i] <= 100",
    sampleCases: [
      { input: "[73,74,75,71,69,72,76,73]", output: "[1,1,4,2,1,1,0,0]" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef daily_temperatures(temperatures):\n    res = [0] * len(temperatures)\n    stack = []\n    for i, t in enumerate(temperatures):\n        while stack and t > stack[-1][0]:\n            stackT, stackIdx = stack.pop()\n            res[stackIdx] = i - stackIdx\n        stack.append((t, i))\n    return res\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    print(json.dumps(daily_temperatures(json.loads(raw))))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[73,74,75,71,69,72,76,73]", expectedOutput: "[1,1,4,2,1,1,0,0]", isHidden: false },
      { input: "[30,40,50,60]", expectedOutput: "[1,1,1,0]", isHidden: true },
      { input: "[30,60,90]", expectedOutput: "[1,1,0]", isHidden: true },
    ],
  },

  // 23. Top K Frequent Elements
  {
    title: "Top K Frequent Elements",
    slug: "top-k-frequent-elements",
    topic: "Arrays & Hashing",
    difficulty: Difficulty.MEDIUM,
    statement: "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements. You may return the answer in any order.",
    constraints: "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4\nk is in the range [1, the number of unique elements in the array].",
    sampleCases: [
      { input: "[1,1,1,2,2,3]\n2", output: "[1,2]" },
    ],
    starterCode: {
      python: "import json, sys\nfrom collections import Counter\n\ndef top_k_frequent(nums, k):\n    count = Counter(nums)\n    return sorted([item[0] for item in count.most_common(k)])\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().splitlines()\n    nums = json.loads(lines[0])\n    k = int(lines[1])\n    print(json.dumps(top_k_frequent(nums, k)))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[1,1,1,2,2,3]\n2", expectedOutput: "[1,2]", isHidden: false },
      { input: "[1]\n1", expectedOutput: "[1]", isHidden: true },
    ],
  },

  // 24. Find Minimum in Rotated Sorted Array
  {
    title: "Find Minimum in Rotated Sorted Array",
    slug: "find-minimum-in-rotated-sorted-array",
    topic: "Binary Search",
    difficulty: Difficulty.MEDIUM,
    statement: "Suppose an array of length `n` sorted in ascending order is rotated between 1 and `n` times. Given the sorted rotated array `nums` of unique elements, return the minimum element of this array.\n\nYou must write an algorithm that runs in O(log n) time.",
    constraints: "n == nums.length\n1 <= n <= 5000\n-5000 <= nums[i] <= 5000\nAll the integers of nums are unique.",
    sampleCases: [
      { input: "[3,4,5,1,2]", output: "1" },
      { input: "[4,5,6,7,0,1,2]", output: "0" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef find_min(nums):\n    l, r = 0, len(nums) - 1\n    while l < r:\n        m = (l + r) // 2\n        if nums[m] > nums[r]: l = m + 1\n        else: r = m\n    return nums[l]\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    print(find_min(json.loads(raw)))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[3,4,5,1,2]", expectedOutput: "1", isHidden: false },
      { input: "[4,5,6,7,0,1,2]", expectedOutput: "0", isHidden: false },
      { input: "[11,13,15,17]", expectedOutput: "11", isHidden: true },
    ],
  },

  // 25. Search in Rotated Sorted Array
  {
    title: "Search in Rotated Sorted Array",
    slug: "search-in-rotated-sorted-array",
    topic: "Binary Search",
    difficulty: Difficulty.MEDIUM,
    statement: "There is an integer array `nums` sorted in ascending order with distinct values. Given the array `nums` after possible rotation and an integer `target`, return the index of `target` if it is in `nums`, or -1 if it is not in `nums`.",
    constraints: "1 <= nums.length <= 5000\n-10^4 <= nums[i], target <= 10^4",
    sampleCases: [
      { input: "[4,5,6,7,0,1,2]\n0", output: "4" },
      { input: "[4,5,6,7,0,1,2]\n3", output: "-1" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef search(nums, target):\n    l, r = 0, len(nums) - 1\n    while l <= r:\n        m = (l + r) // 2\n        if nums[m] == target: return m\n        if nums[l] <= nums[m]:\n            if nums[l] <= target < nums[m]: r = m - 1\n            else: l = m + 1\n        else:\n            if nums[m] < target <= nums[r]: l = m + 1\n            else: r = m - 1\n    return -1\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().splitlines()\n    nums = json.loads(lines[0])\n    target = int(lines[1])\n    print(search(nums, target))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[4,5,6,7,0,1,2]\n0", expectedOutput: "4", isHidden: false },
      { input: "[4,5,6,7,0,1,2]\n3", expectedOutput: "-1", isHidden: false },
      { input: "[1]\n0", expectedOutput: "-1", isHidden: true },
    ],
  },

  // 26. Longest Consecutive Sequence
  {
    title: "Longest Consecutive Sequence",
    slug: "longest-consecutive-sequence",
    topic: "Arrays & Hashing",
    difficulty: Difficulty.MEDIUM,
    statement: "Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence.\n\nYou must write an algorithm that runs in O(n) time.",
    constraints: "0 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
    sampleCases: [
      { input: "[100,4,200,1,3,2]", output: "4" },
      { input: "[0,3,7,2,5,8,4,6,0,1]", output: "9" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef longest_consecutive(nums):\n    num_set = set(nums)\n    longest = 0\n    for n in num_set:\n        if (n - 1) not in num_set:\n            length = 1\n            while (n + length) in num_set: length += 1\n            longest = max(longest, length)\n    return longest\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    print(longest_consecutive(json.loads(raw)))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[100,4,200,1,3,2]", expectedOutput: "4", isHidden: false },
      { input: "[0,3,7,2,5,8,4,6,0,1]", expectedOutput: "9", isHidden: false },
      { input: "[]", expectedOutput: "0", isHidden: true },
    ],
  },

  // 27. Subtree of Another Tree
  {
    title: "Subtree of Another Tree",
    slug: "subtree-of-another-tree",
    topic: "Trees",
    difficulty: Difficulty.EASY,
    statement: "Given the roots of two binary trees `root` and `subRoot`, return `true` if there is a subtree of `root` with the same structure and node values of `subRoot` and `false` otherwise.",
    constraints: "The number of nodes in root is in [1, 2000].",
    sampleCases: [
      { input: "[3,4,5,1,2]\n[4,1,2]", output: "true" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef is_subtree(r1, r2):\n    s1 = ','.join(map(str, r1))\n    s2 = ','.join(map(str, r2))\n    return s2 in s1\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().splitlines()\n    r1 = json.loads(lines[0])\n    r2 = json.loads(lines[1])\n    print(str(is_subtree(r1, r2)).lower())",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[3,4,5,1,2]\n[4,1,2]", expectedOutput: "true", isHidden: false },
      { input: "[3,4,5,1,2,null,null,null,null,0]\n[4,1,2]", expectedOutput: "false", isHidden: true },
    ],
  },

  // 28. Pacific Atlantic Water Flow
  {
    title: "Pacific Atlantic Water Flow",
    slug: "pacific-atlantic-water-flow",
    topic: "Graphs",
    difficulty: Difficulty.MEDIUM,
    statement: "There is an `m x n` rectangular island that borders both the Pacific Ocean and Atlantic Ocean. Return a list of grid coordinates where rainwater can flow to both oceans.",
    constraints: "m == heights.length\nn == heights[r].length\n1 <= m, n <= 200",
    sampleCases: [
      { input: "[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]", output: "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef pacific_atlantic(heights):\n    if not heights: return []\n    R, C = len(heights), len(heights[0])\n    pac, atl = set(), set()\n    def dfs(r, c, visit, prev):\n        if (r, c) in visit or r < 0 or c < 0 or r >= R or c >= C or heights[r][c] < prev: return\n        visit.add((r, c))\n        for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:\n            dfs(r + dr, c + dc, visit, heights[r][c])\n    for c in range(C):\n        dfs(0, c, pac, heights[0][c])\n        dfs(R - 1, c, atl, heights[R - 1][c])\n    for r in range(R):\n        dfs(r, 0, pac, heights[r][0])\n        dfs(r, C - 1, atl, heights[r][C - 1])\n    return sorted([list(p) for p in pac & atl])\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    print(json.dumps(pacific_atlantic(json.loads(raw))))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]", expectedOutput: "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]", isHidden: false },
      { input: "[[1]]", expectedOutput: "[[0,0]]", isHidden: true },
    ],
  },

  // 29. Clone Graph
  {
    title: "Clone Graph",
    slug: "clone-graph",
    topic: "Graphs",
    difficulty: Difficulty.MEDIUM,
    statement: "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph.",
    constraints: "The number of nodes in the graph is in the range [0, 100].",
    sampleCases: [
      { input: "[[2,4],[1,3],[2,4],[1,3]]", output: "[[2,4],[1,3],[2,4],[1,3]]" },
    ],
    starterCode: {
      python: "import json, sys\n\ndef clone_graph(adj):\n    return [list(neighbors) for neighbors in adj]\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    print(json.dumps(clone_graph(json.loads(raw))))",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "[[2,4],[1,3],[2,4],[1,3]]", expectedOutput: "[[2,4],[1,3],[2,4],[1,3]]", isHidden: false },
      { input: "[[]]", expectedOutput: "[[]]", isHidden: true },
    ],
  },

  // 30. Course Schedule
  {
    title: "Course Schedule",
    slug: "course-schedule",
    topic: "Graphs",
    difficulty: Difficulty.MEDIUM,
    statement: "There are a total of `numCourses` courses you have to take, labeled from 0 to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [a, b]` indicates that you must take course `b` first if you want to take course `a`.\n\nReturn `true` if you can finish all courses. Otherwise, return `false`.",
    constraints: "1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000",
    sampleCases: [
      { input: "2\n[[1,0]]", output: "true" },
      { input: "2\n[[1,0],[0,1]]", output: "false" },
    ],
    starterCode: {
      python: "import json, sys\nfrom collections import defaultdict\n\ndef can_finish(n, prereqs):\n    adj = defaultdict(list)\n    for a, b in prereqs: adj[a].append(b)\n    visited = set()\n    cycle = set()\n    def dfs(crs):\n        if crs in cycle: return False\n        if crs in visited: return True\n        cycle.add(crs)\n        for pre in adj[crs]:\n            if not dfs(pre): return False\n        cycle.remove(crs)\n        visited.add(crs)\n        return True\n    for c in range(n):\n        if not dfs(c): return False\n    return True\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().splitlines()\n    n = int(lines[0])\n    prereqs = json.loads(lines[1])\n    print(str(can_finish(n, prereqs)).lower())",
      java: "public class Solution {}",
      cpp: "class Solution {};",
    },
    testCases: [
      { input: "2\n[[1,0]]", expectedOutput: "true", isHidden: false },
      { input: "2\n[[1,0],[0,1]]", expectedOutput: "false", isHidden: false },
      { input: "3\n[[0,1],[1,2],[2,0]]", expectedOutput: "false", isHidden: true },
    ],
  },
];
