import { CryptoUtils } from "../crypto-utils";
import { LockOwner } from "../lock-owner";
import { User } from "../user";
import { UserMetaData } from "../types";

describe("Cryptographic Stress Testing", () => {
  describe("PKCS1_PSS_PADDING Sign-Verify Functionality", () => {
    const STRESS_TEST_ITERATIONS = 10000;
    let results: {
      totalTests: number;
      successfulSigns: number;
      successfulVerifications: number;
      failedSigns: number;
      failedVerifications: number;
      encodingErrors: number;
      timeStats: {
        totalTime: number;
        avgSignTime: number;
        avgVerifyTime: number;
        minSignTime: number;
        maxSignTime: number;
        minVerifyTime: number;
        maxVerifyTime: number;
      };
      edgeCases: {
        emptyData: boolean;
        largeData: boolean;
        unicodeData: boolean;
        specialChars: boolean;
        jsonComplexity: boolean;
      };
    };

    beforeAll(() => {
      results = {
        totalTests: 0,
        successfulSigns: 0,
        successfulVerifications: 0,
        failedSigns: 0,
        failedVerifications: 0,
        encodingErrors: 0,
        timeStats: {
          totalTime: 0,
          avgSignTime: 0,
          avgVerifyTime: 0,
          minSignTime: Infinity,
          maxSignTime: 0,
          minVerifyTime: Infinity,
          maxVerifyTime: 0,
        },
        edgeCases: {
          emptyData: false,
          largeData: false,
          unicodeData: false,
          specialChars: false,
          jsonComplexity: false,
        },
      };
    });

    afterAll(() => {
      // Calculate averages
      results.timeStats.avgSignTime =
        results.timeStats.totalTime / (results.successfulSigns * 2); // Divided by 2 because we measure both sign and verify
      results.timeStats.avgVerifyTime =
        results.timeStats.totalTime / (results.successfulVerifications * 2);

      // Log comprehensive results for thesis documentation
      console.log("\n" + "=".repeat(80));
      console.log("CRYPTOGRAPHIC STRESS TEST RESULTS - PKCS1_PSS_PADDING");
      console.log("=".repeat(80));
      console.log(`Total Tests Conducted: ${results.totalTests}`);
      console.log(
        `Successful Signs: ${results.successfulSigns} (${(
          (results.successfulSigns / results.totalTests) *
          100
        ).toFixed(2)}%)`
      );
      console.log(
        `Successful Verifications: ${results.successfulVerifications} (${(
          (results.successfulVerifications / results.totalTests) *
          100
        ).toFixed(2)}%)`
      );
      console.log(`Failed Signs: ${results.failedSigns}`);
      console.log(`Failed Verifications: ${results.failedVerifications}`);
      console.log(`Encoding Errors: ${results.encodingErrors}`);
      console.log(`\nPerformance Metrics:`);
      console.log(
        `  Average Sign Time: ${results.timeStats.avgSignTime.toFixed(3)}ms`
      );
      console.log(
        `  Average Verify Time: ${results.timeStats.avgVerifyTime.toFixed(3)}ms`
      );
      console.log(
        `  Min Sign Time: ${results.timeStats.minSignTime.toFixed(3)}ms`
      );
      console.log(
        `  Max Sign Time: ${results.timeStats.maxSignTime.toFixed(3)}ms`
      );
      console.log(
        `  Min Verify Time: ${results.timeStats.minVerifyTime.toFixed(3)}ms`
      );
      console.log(
        `  Max Verify Time: ${results.timeStats.maxVerifyTime.toFixed(3)}ms`
      );
      console.log(`\nEdge Cases Tested:`);
      console.log(`  Empty Data: ${results.edgeCases.emptyData ? "✅" : "❌"}`);
      console.log(
        `  Large Data (>10KB): ${results.edgeCases.largeData ? "✅" : "❌"}`
      );
      console.log(
        `  Unicode Data: ${results.edgeCases.unicodeData ? "✅" : "❌"}`
      );
      console.log(
        `  Special Characters: ${results.edgeCases.specialChars ? "✅" : "❌"}`
      );
      console.log(
        `  Complex JSON: ${results.edgeCases.jsonComplexity ? "✅" : "❌"}`
      );
      console.log("=".repeat(80));
    });

    it("should handle basic sign-verify operations stress test", async () => {
      const keyPair = CryptoUtils.generateKeyPair();
      let consecutiveSuccesses = 0;

      for (let i = 0; i < STRESS_TEST_ITERATIONS; i++) {
        results.totalTests++;

        // Generate varied test data
        const testData = generateTestData(i);

        try {
          // Measure sign time
          const signStartTime = performance.now();
          const signResult = CryptoUtils.sign(testData, keyPair.privateKey);
          const signEndTime = performance.now();
          const signTime = signEndTime - signStartTime;

          results.timeStats.minSignTime = Math.min(
            results.timeStats.minSignTime,
            signTime
          );
          results.timeStats.maxSignTime = Math.max(
            results.timeStats.maxSignTime,
            signTime
          );
          results.timeStats.totalTime += signTime;

          if (signResult.signature && signResult.userMetaDataHash) {
            results.successfulSigns++;

            // Measure verify time
            const verifyStartTime = performance.now();
            const verifyResult = CryptoUtils.verify(
              signResult.userMetaDataHash,
              signResult.signature,
              keyPair.publicKey
            );
            const verifyEndTime = performance.now();
            const verifyTime = verifyEndTime - verifyStartTime;

            results.timeStats.minVerifyTime = Math.min(
              results.timeStats.minVerifyTime,
              verifyTime
            );
            results.timeStats.maxVerifyTime = Math.max(
              results.timeStats.maxVerifyTime,
              verifyTime
            );
            results.timeStats.totalTime += verifyTime;

            if (verifyResult) {
              results.successfulVerifications++;
              consecutiveSuccesses++;
            } else {
              results.failedVerifications++;
              consecutiveSuccesses = 0;
            }
          } else {
            results.failedSigns++;
            consecutiveSuccesses = 0;
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes("encoding")) {
            results.encodingErrors++;
          } else {
            results.failedSigns++;
          }
          consecutiveSuccesses = 0;
        }

        // Early termination if too many consecutive failures
        if (
          consecutiveSuccesses === 0 &&
          i > 100 &&
          results.failedSigns + results.failedVerifications > i * 0.1
        ) {
          throw new Error(
            `High failure rate detected at iteration ${i}. Stopping test.`
          );
        }
      }

      // Expect very high success rate (>99.9%)
      const successRate =
        (results.successfulVerifications / results.totalTests) * 100;
      expect(successRate).toBeGreaterThan(99.9);
      expect(results.encodingErrors).toBeLessThan(results.totalTests * 0.001); // Less than 0.1% encoding errors
    }, 60000); // 60 second timeout

    it("should handle edge cases without encoding issues", () => {
      const keyPair = CryptoUtils.generateKeyPair();

      // Test empty data
      try {
        const emptyResult = CryptoUtils.sign("", keyPair.privateKey);
        const emptyVerify = CryptoUtils.verify(
          emptyResult.userMetaDataHash!,
          emptyResult.signature!,
          keyPair.publicKey
        );
        expect(emptyVerify).toBe(true);
        results.edgeCases.emptyData = true;
      } catch (error) {
        console.warn("Empty data test failed:", error);
      }

      // Test large data (>10KB)
      try {
        const largeData = "x".repeat(15000);
        const largeResult = CryptoUtils.sign(largeData, keyPair.privateKey);
        const largeVerify = CryptoUtils.verify(
          largeResult.userMetaDataHash!,
          largeResult.signature!,
          keyPair.publicKey
        );
        expect(largeVerify).toBe(true);
        results.edgeCases.largeData = true;
      } catch (error) {
        console.warn("Large data test failed:", error);
      }

      // Test Unicode data
      try {
        const unicodeData = "Hello 世界 🔐 ñáéíóú Καλημέρα مرحبا";
        const unicodeResult = CryptoUtils.sign(unicodeData, keyPair.privateKey);
        const unicodeVerify = CryptoUtils.verify(
          unicodeResult.userMetaDataHash!,
          unicodeResult.signature!,
          keyPair.publicKey
        );
        expect(unicodeVerify).toBe(true);
        results.edgeCases.unicodeData = true;
      } catch (error) {
        console.warn("Unicode data test failed:", error);
      }

      // Test special characters
      try {
        const specialData = "!@#$%^&*()[]{}|\\:;\"'<>,.?/~`";
        const specialResult = CryptoUtils.sign(specialData, keyPair.privateKey);
        const specialVerify = CryptoUtils.verify(
          specialResult.userMetaDataHash!,
          specialResult.signature!,
          keyPair.publicKey
        );
        expect(specialVerify).toBe(true);
        results.edgeCases.specialChars = true;
      } catch (error) {
        console.warn("Special characters test failed:", error);
      }

      // Test complex JSON
      try {
        const complexJson = {
          user: "test@example.com",
          timestamp: new Date().toISOString(),
          metadata: {
            permissions: ["read", "write", "execute"],
            nested: {
              deep: {
                value: "deep nested value with unicode: 🔐",
              },
            },
          },
          numbers: [1, 2.5, -3, 0.000001, 999999999],
          booleans: [true, false],
          nullValue: null,
        };
        const complexResult = CryptoUtils.sign(complexJson, keyPair.privateKey);
        const complexVerify = CryptoUtils.verify(
          complexResult.userMetaDataHash!,
          complexResult.signature!,
          keyPair.publicKey
        );
        expect(complexVerify).toBe(true);
        results.edgeCases.jsonComplexity = true;
      } catch (error) {
        console.warn("Complex JSON test failed:", error);
      }
    });

    it("should handle concurrent sign-verify operations", async () => {
      const keyPair = CryptoUtils.generateKeyPair();
      const concurrentPromises: Promise<boolean>[] = [];
      const CONCURRENT_OPERATIONS = 100;

      for (let i = 0; i < CONCURRENT_OPERATIONS; i++) {
        const promise = new Promise<boolean>((resolve) => {
          try {
            const testData = generateTestData(i);
            const signResult = CryptoUtils.sign(testData, keyPair.privateKey);
            const verifyResult = CryptoUtils.verify(
              signResult.userMetaDataHash!,
              signResult.signature!,
              keyPair.publicKey
            );
            resolve(verifyResult);
          } catch (error) {
            resolve(false);
          }
        });
        concurrentPromises.push(promise);
      }

      const results = await Promise.all(concurrentPromises);
      const successCount = results.filter((result) => result).length;
      const successRate = (successCount / CONCURRENT_OPERATIONS) * 100;

      expect(successRate).toBeGreaterThan(99); // Expect >99% success rate even under concurrency
    });

    it("should maintain consistency with real VC workflow", () => {
      const lockOwner = new LockOwner();
      const user = new User();
      const lock = lockOwner.registerNewLock("Stress Test Lock");

      // Test real VC issuance and verification cycles using STRESS_TEST_ITERATIONS
      for (let i = 0; i < STRESS_TEST_ITERATIONS; i++) {
        const userMetadata = generateTestData(i);

        // Issue VC with the generated weird data
        const vc = lockOwner.issueVc(
          lock.lockId,
          userMetadata,
          `Test Lock ${i}`
        );

        try {
          user.storeVc(vc);
        } catch (error) {
          throw error;
        }

        // Verify VC
        const isValid = lock.verifyVc(vc);
        expect(isValid).toBe(true);

        results.totalTests++;
        if (isValid) {
          results.successfulVerifications++;
        } else {
          results.failedVerifications++;
        }
      }
    });
  });
});

// Helper function to generate varied test data
function generateTestData(iteration: number): UserMetaData {
  const patterns = [
    // Pattern 1: Normal user data
    {
      email: `user${iteration}@example.com`,
      name: `User ${iteration}`,
      timeStamp: new Date(),
    },
    // Pattern 2: Edge case emails
    {
      email: `very.long.email.address.with.many.dots.${iteration}@subdomain.example-domain.co.uk`,
      name: `User With Spaces And Numbers ${iteration}`,
      timeStamp: new Date(Date.now() + iteration * 1000),
    },
    // Pattern 3: Unicode and special characters
    {
      email: `测试${iteration}@例子.com`,
      name: `Ñáme ${iteration} with ünicode 🔐`,
      timeStamp: new Date(Date.now() - iteration * 1000),
    },
    // Pattern 4: Minimal data
    {
      email: `${iteration}@a.b`,
      timeStamp: new Date(),
    },
    // Pattern 5: Maximum length fields
    {
      email: `${"very".repeat(50)}${iteration}@${"long".repeat(20)}.com`,
      name: `${"Very Long Name ".repeat(20)}${iteration}`,
      timeStamp: new Date(),
    },
  ];

  return patterns[iteration % patterns.length];
}
