import React from 'react';
import './SponsorPage.css';
import { sponsorApi } from '../api/sponsor';
import { useSponsorStore } from '../store/sponsorStore';
import { useSignTransaction, useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

export function SponsorPage() {
  const { transaction, setTransaction, isLoading, setIsLoading, error, setError } =
    useSponsorStore();
  const [gasEstimate, setGasEstimate] = React.useState<any>(null);
  const [sponsoredTx, setSponsoredTx] = React.useState<any>(null);
  const { mutateAsync: signTransaction } = useSignTransaction();
  const currentAccount = useCurrentAccount();
  const [signingState, setSigningState] = React.useState<'idle' | 'signing' | 'signed'>('idle');
  const [userSignature, setUserSignature] = React.useState<string>('');

  const handleUrlChange = React.useCallback(() => {
    // Get transaction from URL params
    const params = new URLSearchParams(window.location.search);
    const tx = params.get('tx');
    const walletAddress = params.get('walletAddress');
    const callbackUrl = params.get('callbackUrl');

    if (tx && walletAddress) {
      const transaction = {
        txBlock: tx,
        walletAddress,
        callbackUrl: callbackUrl || undefined,
      };
      setTransaction(transaction);
      setGasEstimate(null);
      setSponsoredTx(null);
      verifyTransaction(tx, walletAddress);
    } else if (!tx && !walletAddress) {
      // Only reset if we have no params at all
      setTransaction(null);
      setGasEstimate(null);
      setSponsoredTx(null);
    }
  }, []); // Remove dependencies to prevent infinite loop

  React.useEffect(() => {
    // Run on initial mount
    handleUrlChange();

    // Listen for back/forward button
    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [handleUrlChange]);

  const verifyTransaction = async (txBlock: string, walletAddress: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await sponsorApi.verify(txBlock, walletAddress);
      if (result.success && result.gasEstimate) {
        setGasEstimate(result.gasEstimate);
      } else {
        setError(result.error || 'Failed to verify transaction');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error verifying transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSponsor = async () => {
    if (!transaction) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await sponsorApi.sponsor(
        transaction.txBlock,
        transaction.walletAddress,
        transaction.callbackUrl
      );

      if (result.success) {
        setSponsoredTx(result);
        
        // If callback URL provided, prompt user to sign before redirecting
        if (transaction.callbackUrl) {
          // Trigger user signing step
          setSigningState('idle'); // Ready for user to sign
        }
      } else {
        setError(result.error || 'Failed to sponsor transaction');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sponsoring transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSign = async () => {
    if (!sponsoredTx || !currentAccount) return;

    // ✅ CRITICAL: Validate wallet address matches transaction sender
    if (currentAccount.address !== transaction?.walletAddress) {
      setError(
        `Wallet mismatch! Transaction requires ${transaction?.walletAddress} but you're connected with ${currentAccount.address}. Please switch wallets.`
      );
      return;
    }

    setSigningState('signing');
    setError(null);
    try {
      // Decode the sponsored transaction bytes
      const sponsoredTxBytes = Uint8Array.from(
        atob(sponsoredTx.sponsoredTxBlock),
        c => c.charCodeAt(0)
      );

      // User signs the SPONSORED transaction (with gas info included)
      const { signature } = await signTransaction({
        transaction: Transaction.from(sponsoredTxBytes),
      });

      console.log('✅ User signature created:', signature);
      console.log('   From address:', currentAccount.address);
      console.log('   Transaction sender:', transaction?.walletAddress);

      setUserSignature(signature);
      setSigningState('signed');

      // Redirect back with BOTH signatures
      if (transaction?.callbackUrl) {
        const params = new URLSearchParams({
          sponsoredTxBlock: sponsoredTx.sponsoredTxBlock,
          txDigest: sponsoredTx.txDigest,
          gaslessSignature: signature,              // User's signature on sponsored tx
          sponsorSignature: sponsoredTx.sponsorSignature,  // Shinami's sponsor signature
        });
        
        window.location.href = `${transaction.callbackUrl}?${params.toString()}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign transaction');
      setSigningState('idle');
    }
  };

  if (isLoading && !gasEstimate) {
    return <div className="loading">Loading transaction details...</div>;
  }

  return (
    <div className="sponsor-page">
      <div className="sponsor-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>OpenSignal - Transaction Sponsor</h1>
          <ConnectButton />
        </div>

        {error && <div className="error-message">{error}</div>}

        {transaction && gasEstimate && !sponsoredTx && (
          <div className="transaction-details">
            <h2>Review Transaction</h2>

            <div className="detail-section">
              <label>Wallet Address:</label>
              <code>{transaction.walletAddress}</code>
            </div>

            <div className="detail-section">
              <label>Gas Estimate:</label>
              <div className="gas-details">
                <div className="gas-item">
                  <span>Gas Budget:</span>
                  <strong>{gasEstimate.gasBudget} MIST</strong>
                </div>
                <div className="gas-item">
                  <span>Gas Price:</span>
                  <strong>{gasEstimate.gasPrice} MIST</strong>
                </div>
                <div className="gas-item">
                  <span>Computation Cost:</span>
                  <strong>{gasEstimate.computationCost} MIST</strong>
                </div>
                <div className="gas-item">
                  <span>Storage Cost:</span>
                  <strong>{gasEstimate.storageCost} MIST</strong>
                </div>
                <div className="gas-item">
                  <span>Storage Rebate:</span>
                  <strong>{gasEstimate.storageRebate} MIST</strong>
                </div>
              </div>
            </div>

            <button
              className="sponsor-button"
              onClick={handleSponsor}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Sponsor This Transaction'}
            </button>
          </div>
        )}

        {sponsoredTx && signingState === 'idle' && transaction?.callbackUrl && (
          <div className="success-message">
            <h2>✓ Transaction Sponsored Successfully!</h2>
            <p>Now you need to sign the sponsored transaction with your wallet.</p>

            {!currentAccount ? (
              <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '8px', marginTop: '20px' }}>
                <p style={{ margin: 0 }}>⚠️ Please connect your wallet to sign the transaction</p>
              </div>
            ) : currentAccount.address !== transaction.walletAddress ? (
              <div style={{ padding: '20px', background: '#ffebee', borderRadius: '8px', marginTop: '20px' }}>
                <h3 style={{ marginTop: 0, color: '#c62828' }}>❌ Wallet Mismatch!</h3>
                <p style={{ margin: '10px 0' }}>
                  <strong>Transaction sender:</strong><br />
                  <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{transaction.walletAddress}</code>
                </p>
                <p style={{ margin: '10px 0' }}>
                  <strong>Your connected wallet:</strong><br />
                  <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{currentAccount.address}</code>
                </p>
                <p style={{ margin: '10px 0', color: '#c62828' }}>
                  ⚠️ Please switch to the correct wallet that created this transaction.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '8px', marginTop: '20px', marginBottom: '15px' }}>
                  <p style={{ margin: 0 }}>
                    ✅ Wallet matched! Connected as:<br />
                    <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{currentAccount.address}</code>
                  </p>
                </div>
                <button
                  className="sponsor-button"
                  onClick={handleUserSign}
                  style={{ marginTop: '10px' }}
                >
                  Sign Transaction
                </button>
              </div>
            )}

            <div className="tx-details" style={{ marginTop: '20px' }}>
              <label>Transaction Digest:</label>
              <code>{sponsoredTx.txDigest}</code>

              <label>Sponsor Signature:</label>
              <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                {sponsoredTx.sponsorSignature}
              </code>
            </div>
          </div>
        )}

        {sponsoredTx && signingState === 'signing' && (
          <div className="success-message">
            <h2>⏳ Waiting for Signature...</h2>
            <p>Please approve the transaction in your wallet.</p>
          </div>
        )}

        {sponsoredTx && !transaction?.callbackUrl && (
          <div className="success-message">
            <h2>✓ Transaction Sponsored Successfully!</h2>
            <p>Your transaction has been sponsored by OpenSignal.</p>

            <div className="tx-details">
              <label>Transaction Digest:</label>
              <code>{sponsoredTx.txDigest}</code>

              <label>Sponsored TX Block:</label>
              <code>{sponsoredTx.sponsoredTxBlock}</code>

              <label>Sponsor Signature:</label>
              <code>{sponsoredTx.sponsorSignature}</code>
              
              <label>Expires At:</label>
              <code>{new Date(sponsoredTx.expireAtTime * 1000).toLocaleString()}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
