import { CryptoUtils } from "../crypto-utils";
import { LockOwner } from "../lock-owner";
import { User } from "../user";
import { Lock } from "../lock";
import { SmartContract } from "../smart-contract";
import { UserMetaData, VerifiableCredential } from "../types";
import { randomBytes, randomInt } from "crypto";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

describe("Comprehensive Stress Testing with Random Data", () => {
  const NUM_LOCKS = 20;
  const NUM_CRYPTOUTILS_TESTS = 2000;

  let results: {
    timestamp: string;
    cryptoUtilsResults: {
      totalTests: number;
      successfulOperations: number;
      failedOperations: number;
      averageSignTime: number;
      averageVerifyTime: number;
      successRate: number;
      failures: Array<{
        testNumber: number;
        operation: string;
        error: string;
        data: any;
      }>;
    };
    vcWorkflowResults: {
      totalLocks: number;
      successfulWorkflows: number;
      failedWorkflows: number;
      lockResults: Array<{
        lockId: number;
        ownerCreated: boolean;
        lockRegistered: boolean;
        vcIssued: boolean;
        vcVerified: boolean;
        userStored: boolean;
        lockVerified: boolean;
        overallSuccess: boolean;
        error?: string;
        timeTaken: number;
      }>;
      averageWorkflowTime: number;
      successRate: number;
    };
  };

  beforeAll(() => {
    results = {
      timestamp: new Date().toISOString(),
      cryptoUtilsResults: {
        totalTests: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageSignTime: 0,
        averageVerifyTime: 0,
        successRate: 0,
        failures: [],
      },
      vcWorkflowResults: {
        totalLocks: 0,
        successfulWorkflows: 0,
        failedWorkflows: 0,
        lockResults: [],
        averageWorkflowTime: 0,
        successRate: 0,
      },
    };
  });

  afterAll(() => {
    // Calculate final statistics
    if (results.cryptoUtilsResults.totalTests > 0) {
      results.cryptoUtilsResults.successRate =
        (results.cryptoUtilsResults.successfulOperations /
          results.cryptoUtilsResults.totalTests) *
        100;
    }

    if (results.vcWorkflowResults.totalLocks > 0) {
      results.vcWorkflowResults.successRate =
        (results.vcWorkflowResults.successfulWorkflows /
          results.vcWorkflowResults.totalLocks) *
        100;

      results.vcWorkflowResults.averageWorkflowTime =
        results.vcWorkflowResults.lockResults.reduce(
          (sum, lock) => sum + lock.timeTaken,
          0
        ) / results.vcWorkflowResults.lockResults.length;
    }

    // Generate markdown report
    generateMarkdownReport();

    console.log("\n" + "=".repeat(80));
    console.log("COMPREHENSIVE STRESS TEST RESULTS");
    console.log("=".repeat(80));
    console.log(`\nCryptoUtils Testing:`);
    console.log(`  Total Tests: ${results.cryptoUtilsResults.totalTests}`);
    console.log(
      `  Success Rate: ${results.cryptoUtilsResults.successRate.toFixed(2)}%`
    );
    console.log(
      `  Failed Operations: ${results.cryptoUtilsResults.failedOperations}`
    );

    console.log(`\nVC Workflow Testing:`);
    console.log(`  Total Locks: ${results.vcWorkflowResults.totalLocks}`);
    console.log(
      `  Success Rate: ${results.vcWorkflowResults.successRate.toFixed(2)}%`
    );
    console.log(
      `  Average Workflow Time: ${results.vcWorkflowResults.averageWorkflowTime.toFixed(
        2
      )}ms`
    );
    console.log("=".repeat(80));
  });

  test("CryptoUtils Testing with Random Data", async () => {
    console.log(
      `\nStarting CryptoUtils stress test with ${NUM_CRYPTOUTILS_TESTS} random operations...`
    );

    const keyPair = CryptoUtils.generateKeyPair();
    let totalSignTime = 0;
    let totalVerifyTime = 0;
    let signOperations = 0;
    let verifyOperations = 0;

    for (let i = 0; i < NUM_CRYPTOUTILS_TESTS; i++) {
      try {
        // Generate random test data
        const testData = generateRandomUserMetaData(i);
        results.cryptoUtilsResults.totalTests++;

        // Test signing
        const signStart = performance.now();
        const signResult = CryptoUtils.sign(testData, keyPair.privateKey);
        const signEnd = performance.now();

        totalSignTime += signEnd - signStart;
        signOperations++;

        if (!signResult.signature || !signResult.userMetaDataHash) {
          throw new Error("Sign operation returned invalid result");
        }

        // Test verification
        const verifyStart = performance.now();
        const verifyResult = CryptoUtils.verify(
          signResult.userMetaDataHash,
          signResult.signature,
          keyPair.publicKey
        );
        const verifyEnd = performance.now();

        totalVerifyTime += verifyEnd - verifyStart;
        verifyOperations++;

        if (!verifyResult) {
          throw new Error("Verify operation failed");
        }

        results.cryptoUtilsResults.successfulOperations++;
      } catch (error) {
        results.cryptoUtilsResults.failedOperations++;
        results.cryptoUtilsResults.failures.push({
          testNumber: i + 1,
          operation: "sign-verify cycle",
          error: error instanceof Error ? error.message : String(error),
          data: "Random UserMetaData",
        });
      }

      // Progress indicator
      if (i % 100 === 0) {
        console.log(
          `  Progress: ${i + 1}/${NUM_CRYPTOUTILS_TESTS} tests completed`
        );
      }
    }

    // Calculate averages
    results.cryptoUtilsResults.averageSignTime =
      signOperations > 0 ? totalSignTime / signOperations : 0;
    results.cryptoUtilsResults.averageVerifyTime =
      verifyOperations > 0 ? totalVerifyTime / verifyOperations : 0;

    console.log(
      `CryptoUtils testing completed. Success rate: ${(
        (results.cryptoUtilsResults.successfulOperations /
          results.cryptoUtilsResults.totalTests) *
        100
      ).toFixed(2)}%`
    );
  });

  test("VC Workflow Testing for 10 Different Locks", async () => {
    console.log(
      `\nStarting VC workflow test for ${NUM_LOCKS} different locks...`
    );

    const smartContract = SmartContract.getInstance();
    results.vcWorkflowResults.totalLocks = NUM_LOCKS;

    for (let lockIndex = 1; lockIndex <= NUM_LOCKS; lockIndex++) {
      const workflowStart = performance.now();

      const lockResult = {
        lockId: lockIndex,
        ownerCreated: false,
        lockRegistered: false,
        vcIssued: false,
        vcVerified: false,
        userStored: false,
        lockVerified: false,
        overallSuccess: false,
        error: undefined as string | undefined,
        timeTaken: 0,
      };

      try {
        console.log(`  Testing Lock ${lockIndex}/${NUM_LOCKS}...`);

        // Step 1: Create LockOwner
        const lockOwner = new LockOwner();
        lockResult.ownerCreated = true;

        // Step 2: Register new lock with random data
        const lockNickname = generateRandomLockNickname(lockIndex);
        const registeredLock = lockOwner.registerNewLock(lockNickname);
        lockResult.lockRegistered = registeredLock.lockId === lockIndex;

        // Step 3: Create User with random metadata
        const userMetadata = generateRandomUserMetaData(lockIndex);
        const user = new User();

        // Step 4: Issue VC with random nickname
        const vcNickname = generateRandomVCNickname(lockIndex);
        const vc = lockOwner.issueVc(
          registeredLock.lockId,
          userMetadata,
          vcNickname
        );
        lockResult.vcIssued = vc !== null;

        // Step 5: Verify VC structure
        if (vc) {
          const isValidVC =
            vc.lockId === registeredLock.lockId &&
            !!vc.signature &&
            !!vc.userMetaDataHash &&
            vc.lockNickname === vcNickname;
          lockResult.vcVerified = isValidVC;
        }

        // Step 6: User stores the VC
        if (vc) {
          user.storeVc(vc);
          lockResult.userStored = true;
        }

        // Step 7: Create Lock and test VC verification
        const lock = new Lock(registeredLock.lockId, registeredLock.pubK);
        if (vc) {
          const lockVerificationResult = lock.verifyVc(vc);
          lockResult.lockVerified = lockVerificationResult;
        }

        // Overall success check
        lockResult.overallSuccess =
          lockResult.ownerCreated &&
          lockResult.lockRegistered &&
          lockResult.vcIssued &&
          lockResult.vcVerified &&
          lockResult.userStored &&
          lockResult.lockVerified;

        if (lockResult.overallSuccess) {
          results.vcWorkflowResults.successfulWorkflows++;
        } else {
          results.vcWorkflowResults.failedWorkflows++;
        }
      } catch (error) {
        lockResult.error =
          error instanceof Error ? error.message : String(error);
        results.vcWorkflowResults.failedWorkflows++;
      }

      const workflowEnd = performance.now();
      lockResult.timeTaken = workflowEnd - workflowStart;
      results.vcWorkflowResults.lockResults.push(lockResult);
    }

    console.log(
      `VC workflow testing completed. Success rate: ${(
        (results.vcWorkflowResults.successfulWorkflows /
          results.vcWorkflowResults.totalLocks) *
        100
      ).toFixed(2)}%`
    );
  });

  // Helper Functions for Random Data Generation
  function generateRandomUserMetaData(seed: number): UserMetaData {
    // 10% chance for extreme edge cases
    if (Math.random() < 0.1) {
      return generateExtremeEdgeCaseUserMetaData(seed);
    }

    return {
      email: generateRandomEmail(seed),
      name: Math.random() > 0.2 ? generateRandomName(seed) : undefined,
      timeStamp: generateRandomTimestamp(),
    };
  }

  // Generate extreme edge cases with weird characters and empty strings
  function generateExtremeEdgeCaseUserMetaData(seed: number): UserMetaData {
    const edgeCases = [
      // Empty strings
      { email: "", name: "", timeStamp: new Date() },
      { email: " ", name: " ", timeStamp: new Date() }, // Just spaces

      // Weird Unicode characters
      { email: "🚀@💻.com", name: "👨‍💻 Test User 🔥", timeStamp: new Date() },
      { email: "test@域名.中国", name: "用户", timeStamp: new Date() },

      // Control characters and special sequences
      {
        email: "test\n@exam\tple.com",
        name: "User\r\nWith\tTabs",
        timeStamp: new Date(),
      },
      {
        email: "test\0null@example.com",
        name: "Null\0User",
        timeStamp: new Date(),
      },

      // Very long strings
      {
        email: "a".repeat(1000) + "@example.com",
        name: "Very".repeat(100) + "LongName",
        timeStamp: new Date(),
      },

      // SQL injection-like strings
      {
        email: "'DROP TABLE users;--@example.com",
        name: "'; DELETE FROM *; --",
        timeStamp: new Date(),
      },

      // JSON-breaking characters
      {
        email: 'test"quotes@example.com',
        name: 'User"With"Quotes',
        timeStamp: new Date(),
      },
      {
        email: "test\\backslash@example.com",
        name: "User\\With\\Backslashes",
        timeStamp: new Date(),
      },

      // Special Unicode categories
      {
        email: "test@ěščřžýáíé.cz",
        name: "Diacrítìçs Üser",
        timeStamp: new Date(),
      },
      { email: "тест@пример.рф", name: "Кириллица", timeStamp: new Date() },
      {
        email: "اختبار@مثال.السعودية",
        name: "مستخدم عربي",
        timeStamp: new Date(),
      },

      // Zero-width characters
      {
        email: "test​@exam‌ple.com",
        name: "User​With‌ZeroWidth",
        timeStamp: new Date(),
      },

      // Extreme timestamps
      { email: "test@example.com", name: "User", timeStamp: new Date(0) }, // Unix epoch
      {
        email: "test@example.com",
        name: "User",
        timeStamp: new Date(8640000000000000),
      }, // Max date
      {
        email: "test@example.com",
        name: "User",
        timeStamp: new Date(-8640000000000000),
      }, // Min date
    ];

    return edgeCases[seed % edgeCases.length];
  }

  function generateRandomEmail(seed: number): string {
    // 15% chance for weird email formats
    if (Math.random() < 0.15) {
      return generateWeirdEmail(seed);
    }

    const domains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "university.edu",
      "company.org",
      "test.co.uk",
      "example.net",
      "domain.info",
    ];
    const localPart = generateRandomString(randomInt(1, 50)); // Allow very short or long
    const domain = domains[seed % domains.length];
    return `${localPart}@${domain}`;
  }

  function generateWeirdEmail(seed: number): string {
    const weirdEmails = [
      "", // Empty string
      "@", // Just @
      "@@", // Double @
      "@domain.com", // Missing local part
      "user@", // Missing domain
      "user@.com", // Empty domain part
      "user@domain.", // Trailing dot
      "user@domain..com", // Double dots
      ".user@domain.com", // Leading dot
      "user.@domain.com", // Trailing dot in local
      "us..er@domain.com", // Double dots in local
      "user+tag@domain.com", // Plus addressing
      "user@domain.c", // Single char TLD
      "user@localhost", // No TLD
      "very.long.email.address.that.goes.on.and.on@very.long.domain.name.that.also.goes.on.com",
      "user name@domain.com", // Space in local part
      "user@domain name.com", // Space in domain
      "user@[192.168.1.1]", // IP address domain
      "user@xn--e1afmkfd.xn--p1ai", // Punycode domain
      "用户@域名.中国", // Full Unicode email
      "tëst@dömäin.com", // Diacritics
      "test@тест.рф", // Cyrillic domain
      "🚀@💻.com", // Emoji email
      '"quoted user"@domain.com', // Quoted local part
      "user\\@domain@example.com", // Escaped characters
      "user\n@domain.com", // Newline
      "user\t@domain.com", // Tab
      "user\0@domain.com", // Null character
    ];

    return weirdEmails[seed % weirdEmails.length];
  }

  function generateRandomName(seed: number): string {
    // 20% chance for weird names
    if (Math.random() < 0.2) {
      return generateWeirdName(seed);
    }

    const firstNames = [
      "John",
      "Jane",
      "Alex",
      "Maria",
      "David",
      "Sarah",
      "Michael",
      "Lisa",
      "José",
      "François",
      "Müller",
      "Åse",
      "Björk",
      "Ñoño",
      "Żółć",
      "محمد",
      "李",
      "田中",
      "Владимир",
      "Δημήτρης",
      "İbrahim",
    ];
    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "O'Connor",
      "D'Angelo",
      "van der Berg",
      "MacLeod",
      "Øst",
      "الأحمد",
      "王",
      "佐藤",
      "Петров",
      "Παπαδόπουλος",
      "Yılmaz",
    ];

    const firstName = firstNames[seed % firstNames.length];
    const lastName = lastNames[(seed * 7) % lastNames.length];

    return `${firstName} ${lastName}`;
  }

  function generateWeirdName(seed: number): string {
    const weirdNames = [
      "", // Empty string
      " ", // Just space
      "\t", // Just tab
      "\n", // Just newline
      "   ", // Multiple spaces
      "A", // Single character
      "X Æ A-XII", // Elon's kid's name
      "🚀 Rocket Person 🌟", // With emojis
      "John\nDoe", // With newline
      "Jane\tSmith", // With tab
      "User\0Null", // With null character
      "O'Reilly-van der Berg III", // Complex punctuation
      '"Quoted Name"', // Quoted name
      "Name\\With\\Backslashes", // Backslashes
      "SQL'; DROP TABLE users; --", // SQL injection attempt
      "JavaScript<script>alert('xss')</script>", // XSS attempt
      "VeryLongNameThatGoesOnAndOnAndNeverSeemsToEnd".repeat(10), // Extremely long
      "用户名字", // Chinese
      "الاسم الكامل", // Arabic
      "Имя Фамилия", // Cyrillic
      "Νικόλαος Παπαδόπουλος", // Greek
      "João da Silva", // Portuguese with diacritics
      "François Müller", // Mixed diacritics
      "Bjørk Guðmundsdóttir", // Icelandic
      "👨‍💻 Code Ninja 🥷", // Professional emojis
      "Mr. Dr. Prof. Sir John", // Many titles
      "Anne-Marie-Claire", // Hyphens
      "O'Neil-MacPherson", // Apostrophe and hyphen
      "von Habsburg zu Österreich", // Noble titles
      "ALLCAPS PERSON", // All caps
      "lowercase person", // All lowercase
      "CamelCasePerson", // CamelCase
      "snake_case_person", // Snake case
      "kebab-case-person", // Kebab case
      "MiXeD cAsE pErSoN", // Mixed case
      "123 Numeric Person", // Starting with numbers
      "Person 456", // Ending with numbers
      "Test@Email.com", // Email-like name
      "https://person.com", // URL-like name
      "C:\\Users\\Person", // File path-like
      "/home/user/person", // Unix path-like
      "SELECT * FROM person", // SQL-like
      "{name: 'person'}", // JSON-like
      "null", // Reserved word
      "undefined", // Reserved word
      "true", // Boolean
      "false", // Boolean
      "NaN", // JavaScript special value
      "Infinity", // JavaScript special value
    ];

    return weirdNames[seed % weirdNames.length];
  }

  function generateRandomLockNickname(lockId: number): string {
    // 30% chance for weird lock nicknames
    if (Math.random() < 0.3) {
      return generateWeirdLockNickname(lockId);
    }

    const adjectives = [
      "Smart",
      "Secure",
      "Digital",
      "Advanced",
      "Modern",
      "Reliable",
      "💻 High-Tech",
      "🔒 Ultra-Secure",
      "🚀 Next-Gen",
      "⚡ Lightning",
    ];
    const nouns = [
      "Door",
      "Gate",
      "Lock",
      "Access",
      "Entry",
      "Portal",
      "🚪 Gateway",
      "🔐 Vault",
      "🏠 Home",
      "🏢 Office",
    ];

    const adj = adjectives[lockId % adjectives.length];
    const noun = nouns[lockId % nouns.length];

    return `${adj} ${noun} ${lockId}`;
  }

  function generateWeirdLockNickname(lockId: number): string {
    const weirdNicknames = [
      "", // Empty string
      " ", // Just space
      "Lock\n" + lockId, // With newline
      "Lock\t" + lockId, // With tab
      `Lock${lockId}${"!".repeat(100)}`, // Many exclamations
      "🔒🚪🔐🏠🏢⚡💻🚀" + lockId, // All emojis
      "SQL'; DROP TABLE locks; --", // SQL injection
      "<script>alert('Lock" + lockId + "')</script>", // XSS attempt
      "Lock " + "Very ".repeat(50) + lockId, // Very long
      "Замок " + lockId, // Russian
      "鎖 " + lockId, // Chinese
      "قفل " + lockId, // Arabic
      "🔒​🚪‌🔐‍🏠", // Zero-width characters
      '"Lock"' + lockId, // Quoted
      "Lock\\With\\Backslashes\\" + lockId, // Backslashes
      "Lock/With/Slashes/" + lockId, // Forward slashes
      "Lock@Email.com" + lockId, // Email-like
      "https://lock" + lockId + ".com", // URL-like
      "Lock" + lockId + ".exe", // File-like
      "NULL", // SQL null
      "undefined", // JavaScript undefined
      "NaN", // Not a number
      "Infinity", // JavaScript infinity
      "true", // Boolean
      "false", // Boolean
      "0", // Zero
      "-1", // Negative
      "3.14159", // Pi
      "Lock " + String.fromCharCode(0) + lockId, // Null character
    ];

    return weirdNicknames[lockId % weirdNicknames.length];
  }

  function generateRandomVCNickname(lockId: number): string {
    // 30% chance for weird VC nicknames
    if (Math.random() < 0.3) {
      return generateWeirdVCNickname(lockId);
    }

    const prefixes = [
      "Access to",
      "Entry for",
      "Key to",
      "Credential for",
      "🔑 Access to",
      "🚪 Entry for",
      "🎫 Ticket to",
      "💳 Card for",
    ];
    const lockNames = [
      "Main Door",
      "Side Gate",
      "Office",
      "Lab",
      "Storage",
      "Entrance",
      "🏠 Home",
      "🏢 Building",
      "🚗 Garage",
      "🏪 Store",
    ];

    const prefix = prefixes[lockId % prefixes.length];
    const lockName = lockNames[lockId % lockNames.length];

    return `${prefix} ${lockName}`;
  }

  function generateWeirdVCNickname(lockId: number): string {
    const weirdVCNicknames = [
      "", // Empty
      " ", // Space
      "VC\n" + lockId, // Newline
      "VC\t" + lockId, // Tab
      "🎫🔑🚪🏠🎟️" + lockId, // Emoji only
      "'; DELETE FROM credentials; --", // SQL injection
      "<iframe src='evil.com'></iframe>", // XSS
      "VC " + "Super ".repeat(30) + lockId, // Very long
      "Доступ " + lockId, // Russian
      "アクセス " + lockId, // Japanese
      "الوصول " + lockId, // Arabic
      "πρόσβαση " + lockId, // Greek
      "VC" + String.fromCharCode(0x200b) + lockId, // Zero-width
      '"VC"' + lockId, // Quoted
      "VC\\Path\\To\\" + lockId, // Path-like
      "ftp://vc" + lockId + ".com", // FTP URL
      "VC" + lockId + ".json", // JSON file
      "null", // Null
      "undefined", // Undefined
      "{vc: " + lockId + "}", // JSON-like
      "[VC" + lockId + "]", // Array-like
      "VC" + lockId + " & Co.", // With ampersand
      "VC < " + lockId + " > test", // With angle brackets
      "VC|" + lockId + "|pipe", // With pipe
      "VC" + lockId + "% complete", // With percent
      "VC#" + lockId + "#hash", // With hash
    ];

    return weirdVCNicknames[lockId % weirdVCNicknames.length];
  }

  function generateRandomTimestamp(): Date {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const randomOffset = randomInt(-30 * oneDay, oneDay); // Within last 30 days to next day
    return new Date(now + randomOffset);
  }

  function generateRandomString(length: number): string {
    // 25% chance for weird character sets
    if (Math.random() < 0.25) {
      return generateWeirdCharacterString(length);
    }

    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[randomInt(0, chars.length)];
    }
    return result;
  }

  function generateWeirdCharacterString(length: number): string {
    // Various character sets that might break things
    const charSets = [
      // Control characters
      "\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F",

      // Special punctuation
      "!@#$%^&*()_+-=[]{}|\\:;\"'<>,.?/~`",

      // Extended ASCII
      "àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ",

      // Emoji and symbols
      "😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗☺😚😙🥲😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬🤥😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵🤯🤠🥳🥸😎🤓🧐😕😟🙁☹😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈👿💀☠💩🤡👹👺👻👽👾🤖😺😸😹😻😼😽🙀😿😾🙈🙉🙊",

      // Mathematical symbols
      "±×÷∞≈≠≤≥∑∏∫√∂∆∇∈∉∪∩⊂⊃⊆⊇∧∨¬→←↑↓↔⇒⇐⇑⇓⇔∀∃∄∅∖",

      // Currency symbols
      "$€£¥₹₽₿¢₡₦₨₩₪₫€￠￡￢￣￤￥￦",

      // Various scripts
      "αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ", // Greek
      "абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ", // Cyrillic
      "أبتثجحخدذرزسشصضطظعغفقكلمنهوي", // Arabic
      "אבגדהוזחטיכלמנסעפצקרשת", // Hebrew
      "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん", // Hiragana
      "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン", // Katakana
      "一二三四五六七八九十百千万億兆", // Chinese numbers

      // Zero-width and invisible characters
      "\u200B\u200C\u200D\u2060\uFEFF", // Zero-width spaces

      // Combining characters
      "\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307\u0308\u0309\u030A\u030B\u030C",

      // Whitespace varieties
      " \t\n\r\f\v\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000",
    ];

    const selectedCharSet = charSets[randomInt(0, charSets.length)];
    let result = "";

    for (let i = 0; i < length; i++) {
      if (selectedCharSet.length === 0) {
        result += String.fromCharCode(randomInt(0, 0x10000)); // Random Unicode
      } else {
        result += selectedCharSet[randomInt(0, selectedCharSet.length)];
      }
    }

    return result;
  }

  function generateMarkdownReport(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportDir = `stress-test-results-${timestamp}`;

    try {
      mkdirSync(reportDir, { recursive: true });
    } catch (error) {
      console.warn(`Could not create directory ${reportDir}:`, error);
      return;
    }

    const report = `# Comprehensive Stress Test Report

**Generated:** ${new Date().toLocaleString()}  
**Test Duration:** CryptoUtils (${NUM_CRYPTOUTILS_TESTS} operations) + VC Workflow (${NUM_LOCKS} locks)

## CryptoUtils Testing with Random Data

### Overview
- **Total Operations:** ${results.cryptoUtilsResults.totalTests}
- **Successful Operations:** ${results.cryptoUtilsResults.successfulOperations}
- **Failed Operations:** ${results.cryptoUtilsResults.failedOperations}
- **Success Rate:** ${results.cryptoUtilsResults.successRate.toFixed(2)}%

### Performance Metrics
- **Average Sign Time:** ${results.cryptoUtilsResults.averageSignTime.toFixed(
      3
    )}ms
- **Average Verify Time:** ${results.cryptoUtilsResults.averageVerifyTime.toFixed(
      3
    )}ms

### Failure Analysis
${
  results.cryptoUtilsResults.failures.length > 0
    ? `**Failed Operations:** ${results.cryptoUtilsResults.failures.length}

${results.cryptoUtilsResults.failures
  .slice(0, 10)
  .map((f) => `- Test ${f.testNumber}: ${f.operation} - ${f.error}`)
  .join("\n")}

${
  results.cryptoUtilsResults.failures.length > 10
    ? `... and ${results.cryptoUtilsResults.failures.length - 10} more failures`
    : ""
}`
    : "No failures detected! 🎉"
}

## VC Workflow Testing for ${NUM_LOCKS} Different Locks

### Overview
- **Total Locks Tested:** ${results.vcWorkflowResults.totalLocks}
- **Successful Workflows:** ${results.vcWorkflowResults.successfulWorkflows}
- **Failed Workflows:** ${results.vcWorkflowResults.failedWorkflows}
- **Success Rate:** ${results.vcWorkflowResults.successRate.toFixed(2)}%
- **Average Workflow Time:** ${results.vcWorkflowResults.averageWorkflowTime.toFixed(
      2
    )}ms

### Individual Lock Results

| Lock ID | Owner | Register | Issue VC | Verify VC | Store VC | Lock Verify | Success | Time (ms) |
|---------|-------|----------|----------|-----------|----------|-------------|---------|-----------|
${results.vcWorkflowResults.lockResults
  .map(
    (lock) =>
      `| ${lock.lockId} | ${lock.ownerCreated ? "✅" : "❌"} | ${
        lock.lockRegistered ? "✅" : "❌"
      } | ${lock.vcIssued ? "✅" : "❌"} | ${lock.vcVerified ? "✅" : "❌"} | ${
        lock.userStored ? "✅" : "❌"
      } | ${lock.lockVerified ? "✅" : "❌"} | ${
        lock.overallSuccess ? "✅" : "❌"
      } | ${lock.timeTaken.toFixed(1)} |`
  )
  .join("\n")}

### Workflow Step Analysis
${(() => {
  const steps = [
    "ownerCreated",
    "lockRegistered",
    "vcIssued",
    "vcVerified",
    "userStored",
    "lockVerified",
  ];
  return steps
    .map((step) => {
      const successCount = results.vcWorkflowResults.lockResults.filter(
        (lock) => lock[step as keyof typeof lock]
      ).length;
      const rate = (
        (successCount / results.vcWorkflowResults.totalLocks) *
        100
      ).toFixed(1);
      return `- **${step
        .replace(/([A-Z])/g, " $1")
        .toLowerCase()}:** ${successCount}/${
        results.vcWorkflowResults.totalLocks
      } (${rate}%)`;
    })
    .join("\n");
})()}

### Failed Workflows
${
  results.vcWorkflowResults.lockResults.filter((lock) => !lock.overallSuccess)
    .length > 0
    ? results.vcWorkflowResults.lockResults
        .filter((lock) => !lock.overallSuccess)
        .map(
          (lock) =>
            `- **Lock ${lock.lockId}:** ${
              lock.error || "Partial workflow failure"
            }`
        )
        .join("\n")
    : "All workflows completed successfully! 🎉"
}

## Summary

### Key Findings
- **CryptoUtils Reliability:** ${
      results.cryptoUtilsResults.successRate > 99
        ? "Excellent"
        : results.cryptoUtilsResults.successRate > 95
        ? "Good"
        : "Needs Improvement"
    } (${results.cryptoUtilsResults.successRate.toFixed(2)}% success)
- **VC Workflow Reliability:** ${
      results.vcWorkflowResults.successRate > 99
        ? "Excellent"
        : results.vcWorkflowResults.successRate > 95
        ? "Good"
        : "Needs Improvement"
    } (${results.vcWorkflowResults.successRate.toFixed(2)}% success)
- **Performance:** Average workflow completion in ${results.vcWorkflowResults.averageWorkflowTime.toFixed(
      1
    )}ms

### Recommendations for Thesis
${
  results.cryptoUtilsResults.successRate === 100 &&
  results.vcWorkflowResults.successRate === 100
    ? `- System demonstrates high reliability with random data
- Cryptographic operations are stable and consistent  
- VC workflow is robust across multiple lock scenarios
- Suitable for production deployment considerations`
    : `- Review failure cases to improve system robustness
- Consider additional error handling for edge cases
- Analyze performance bottlenecks in workflow steps
- Investigate causes of ${
        results.cryptoUtilsResults.failedOperations +
        results.vcWorkflowResults.failedWorkflows
      } total failures`
}

---
*This report was automatically generated by the comprehensive stress testing suite.*
`;

    const reportPath = join(reportDir, "comprehensive-stress-test-report.md");

    try {
      writeFileSync(reportPath, report);
      console.log(
        `\n📊 Comprehensive stress test report generated: ${reportPath}`
      );
    } catch (error) {
      console.error("Failed to write report:", error);
    }
  }
});
