const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Builds the expected FizzBuzz output so we don't make typos by hand
const fizz = (n) =>
  Array.from({ length: n }, (_, i) => {
    const x = i + 1;
    if (x % 15 === 0) return "FizzBuzz";
    if (x % 3 === 0) return "Fizz";
    if (x % 5 === 0) return "Buzz";
    return String(x);
  }).join("\n");

const problems = [
  {
    slug: "a-plus-b",
    title: "A + B",
    difficulty: "EASY",
    description: `Read two integers from one line and print their sum.

**Input:** one line with two integers \`a\` and \`b\`, separated by a space.

**Output:** a single integer, \`a + b\`.`,
    testCases: [
      { input: "3 4\n", expectedOutput: "7", isSample: true },
      { input: "-5 10\n", expectedOutput: "5", isSample: true },
      { input: "0 0\n", expectedOutput: "0" },
      { input: "1000000 2000000\n", expectedOutput: "3000000" },
    ],
  },
  {
    slug: "reverse-string",
    title: "Reverse a String",
    difficulty: "EASY",
    description: `Read a line of text and print it reversed.

**Input:** one line of text (it may contain spaces).

**Output:** the same text, reversed.`,
    testCases: [
      { input: "hello\n", expectedOutput: "olleh", isSample: true },
      { input: "Python is fun\n", expectedOutput: "nuf si nohtyP", isSample: true },
      { input: "a\n", expectedOutput: "a" },
      { input: "racecar\n", expectedOutput: "racecar" },
    ],
  },
  {
    slug: "fizzbuzz",
    title: "FizzBuzz",
    difficulty: "EASY",
    description: `Read an integer \`n\`. For each number from 1 to \`n\`, print on its own line:

- \`FizzBuzz\` if it is divisible by both 3 and 5
- \`Fizz\` if it is divisible by 3
- \`Buzz\` if it is divisible by 5
- the number itself otherwise`,
    testCases: [
      { input: "5\n", expectedOutput: fizz(5), isSample: true },
      { input: "15\n", expectedOutput: fizz(15) },
      { input: "1\n", expectedOutput: fizz(1) },
      { input: "100\n", expectedOutput: fizz(100) },
    ],
  },
  {
    slug: "maximum-subarray",
    title: "Maximum Subarray Sum",
    difficulty: "MEDIUM",
    description: `Given an array of integers, find the contiguous subarray with the largest sum and print that sum.

**Input:** the first line has \`n\`. The second line has \`n\` integers separated by spaces.

**Output:** the maximum subarray sum.`,
    testCases: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4\n", expectedOutput: "6", isSample: true },
      { input: "1\n-1\n", expectedOutput: "-1" },
      { input: "5\n1 2 3 4 5\n", expectedOutput: "15" },
      { input: "3\n-3 -2 -5\n", expectedOutput: "-2" },
    ],
  },
];

async function main() {
  for (const p of problems) {
    const { testCases, ...data } = p;
    await prisma.problem.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...data,
        testCases: {
          create: testCases.map((t, i) => ({ ...t, position: i })),
        },
      },
    });
  }
  console.log(`Seeded ${problems.length} problems`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());