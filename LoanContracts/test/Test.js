const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe("Contract", function () {

   describe("Deploy", function () {

      async function Deployment() {
         const [lender, borrower] = await ethers.getSigners();

         const lenderContract = await ethers.getContractFactory('Lender', lender);
         const borrowerContract = await ethers.getContractFactory('Borrower', borrower);

         const Lendermoney = ethers.parseEther("500");


         const LenderContract = await lenderContract.deploy({ value: Lendermoney });
         await LenderContract.waitForDeployment();

         const BorrowerContract = await borrowerContract.deploy(LenderContract.target);
         await BorrowerContract.waitForDeployment();

         return { lender, borrower, LenderContract, BorrowerContract };
      }

      it("Lender deployment successful", async function () {

         const { LenderContract } = await loadFixture(Deployment);
         expect(await ethers.provider.getBalance(LenderContract.target))
            .to.equal(ethers.parseEther("500"));

      });

      it("Borrower deployment successful", async function () {

         const { LenderContract, BorrowerContract } = await loadFixture(Deployment);
         expect(await BorrowerContract.lender()).to.equal(LenderContract.target);

      });

      describe('Requesting loan', function () {

         let borrower, LenderContract;
         let blockNum, block, deadline;

         beforeEach(async function () {
            ({ borrower, LenderContract } = await loadFixture(Deployment));

            blockNum = await ethers.provider.getBlockNumber();
            block = await ethers.provider.getBlock(blockNum);
            deadline = block.timestamp + (3 * 24 * 60 * 60);
         });

         it("should revert if collateral is missing", async function () {
            await expect(
               LenderContract.connect(borrower).RequestLoan(
                  borrower.address,
                  50,
                  deadline,
                  { value: 0 }   // no collateral
               )
            ).to.be.revertedWith("Collateral is required");
         });

         it("should revert if amount is zero", async function () {
            await expect(
               LenderContract.connect(borrower).RequestLoan(
                  borrower.address,
                  0,  // invalid amount
                  deadline,
                  { value: ethers.parseEther("1") }
               )
            ).to.be.revertedWith("Amount must be greater than 0");
         });

         it("should emit CollateralLocked event when loan requested correctly", async function () {
            await expect(
               LenderContract.connect(borrower).RequestLoan(
                  borrower.address,
                  50,
                  deadline,
                  { value: ethers.parseEther("1") }
               )
            ).to.emit(LenderContract, "collateralLocked").withArgs(
               borrower.address,
               0,
               ethers.parseEther("1")
            );
         });

         /*it("should revert if collateral is below threshold", async function () {
            const lowCollateral = ethers.parseEther("0.001"); // deliberately too small

            await expect(
               LenderContract.connect(borrower).RequestLoan(
                  borrower.address,
                  100, // amount
                  deadline,
                  { value: lowCollateral }
               )
            ).to.be.revertedWith("Not sufficient Collateral");
         });
   */

         it("should pass if collateral is above threshold", async function () {
            const collateral = await LenderContract.CalculateCollateral(100, 150);
            const threshold = await LenderContract.collateralThreshold();

            expect(collateral).to.be.gte(threshold);
         });

      });//closing Request loan

      describe("validating the actions in lender", async function () {
         let LenderContract, lender, borrower;

         beforeEach(async function () {
            const blockNum = await ethers.provider.getBlockNumber();
            const block = await ethers.provider.getBlock(blockNum);
            const deadline = block.timestamp + (3 * 24 * 60 * 60);

            ({ LenderContract, lender, borrower } = await loadFixture(Deployment));

            await LenderContract.connect(borrower).RequestLoan(
               borrower.address,
               ethers.parseEther('2'),
               deadline,
               { value: ethers.parseEther('4') }
            )
         });

         describe("Approve the loan", async function () {

            //checking status before approving
            it("loan status,approval,balance check before loan issuing", async function () {

               expect(await LenderContract.approval(0)).to.equal(false);
               const loan = await LenderContract.loans(0);
               expect(loan.status).to.equal(0);

               expect(await ethers.provider.getBalance(LenderContract.target)).to.gte(loan.amount);


            })

            it("loan status, approval, and event check after loan issuing", async function () {
               // First approval should emit "funded"
               await expect(LenderContract.connect(lender).ApproveLoan(0))
                  .to.emit(LenderContract, "funded")
                  .withArgs(
                     borrower.address,
                     ethers.parseEther("2"),
                     (await LenderContract.loans(0)).deadline,
                     0
                  );

               const loan = await LenderContract.loans(0);

               // Status should now be Funded
               expect(loan.status).to.equal(1);

               // Approval mapping should be true
               expect(await LenderContract.approval(0)).to.equal(true);

               // Second approval attempt should revert
               await expect(LenderContract.connect(lender).ApproveLoan(0))
                  .to.be.revertedWith("Loan is not Pending");
            });

         })//closing Approve loan

         describe("Repay loan", async function () {

            it("Loan Repay check", async function () {

               //first need to approve the loan
               await LenderContract.connect(lender).ApproveLoan(0);

               //approval check before calling the Repay function
               expect(await LenderContract.approval(0)).to.equal(true);

               const loan = await LenderContract.loans(0);
               //status check before calling the Repay function
               expect(loan.status).to.equal(1);

               let amount = loan.amount;

               const blockNum = await ethers.provider.getBlockNumber();
               const block = await ethers.provider.getBlock(blockNum);

               if (block.timestamp > loan.deadline) {

                  const interest = (amount * 10) / 100;
                  amount += interest;

               }

               expect(await ethers.provider.getBalance(borrower.address)).to.gte(amount);

               //emitting events
               await expect(LenderContract.connect(borrower).Repay(0, { value: amount })).to.emit(LenderContract, "repaid").withArgs(
                  loan.borrower,
                  true,
                  amount,
                  loan.collateral
               ).and.to.emit(LenderContract, "collateralReleased").withArgs(
                  loan.borrower,
                  0,
                  loan.collateral
               );

               const updatedloan = await LenderContract.loans(0);
               //checking status after Repay function called
               expect(updatedloan.status).to.equal(2);

            })
         })//closing RePay loan

         describe("liqiudate", async function () {

            it("validating liquidate functionality", async function () {

               //checking the loan status
               await LenderContract.connect(lender).ApproveLoan(0);
               let loan = await LenderContract.loans(0);
               expect(loan.status).to.equal(1);

               //checking the deadline
               const blockNum = await ethers.provider.getBlockNumber();
               const block = await ethers.provider.getBlock(blockNum);

               expect(await loan.deadline).to.gte(block.timestamp);

               //emitting the event
               await expect(LenderContract.connect(lender).liqiudate(0)).to.emit(LenderContract, "collateralLiquidated").
                  withArgs(
                     loan.borrower,
                     0,
                     loan.collateral
                  );

               loan = await LenderContract.loans(0);

               //checking the status after liquidated
               expect(loan.status).to.equal(3);

            })
         })//closing liquidate

      });//closing validating actions 
   });
});
