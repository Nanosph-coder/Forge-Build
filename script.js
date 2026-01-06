const CONTRACT_ADDRESS = "0xd2a5bC10698FD955D1Fe6cb468a17809A08fd005";
const CONTRACT_ABI = [
    "function get() public view returns (uint)",
    "function set(uint x) public"
];

let provider;
let signer;
let contract;

document.addEventListener('DOMContentLoaded', async () => {
    const numberInput = document.getElementById('number-input');
    const submitBtn = document.getElementById('submit-btn');
    const displayValue = document.getElementById('display-value');
    const statusMsg = document.getElementById('transaction-status');
    const txInfo = document.getElementById('tx-info');
    const txLink = document.getElementById('tx-link');

    async function initWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                provider = new ethers.BrowserProvider(window.ethereum);
                
                const network = await provider.getNetwork();
                if (network.chainId !== 11155111n) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0xaa36a7' }], 
                        });
                        provider = new ethers.BrowserProvider(window.ethereum);
                    } catch (switchError) {
                        if (switchError.code === 4902) {
                            alert("Please add the Sepolia Testnet to your MetaMask!");
                        }
                        throw new Error("Wrong network connected");
                    }
                }

                await provider.send("eth_requestAccounts", []);
                
                signer = await provider.getSigner();
                
                const code = await provider.getCode(CONTRACT_ADDRESS);
                if (code === "0x") {
                    statusMsg.textContent = 'Error: No contract found at this address on Sepolia!';
                    statusMsg.style.color = 'red';
                    console.error("The address " + CONTRACT_ADDRESS + " has no code on this network.");
                    return;
                }

                contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
                
                statusMsg.textContent = 'Wallet Connected (Sepolia).';
                statusMsg.style.color = 'var(--primary)'; // Or 'green' if you don't have CSS var
                
                await fetchStoredValue();

            } catch (error) {
                console.error("Initialization Error:", error);
                statusMsg.textContent = 'Connection denied or wrong network.';
                statusMsg.style.color = 'red';
            }
        } else {
            statusMsg.textContent = 'Please install MetaMask!';
            statusMsg.style.color = 'red';
        }
    }

    async function fetchStoredValue() {
        if (!contract) return;
        
        try {
            const currentVal = await contract.get();
            displayValue.textContent = currentVal.toString();
        } catch (error) {
            console.error(error);
        }
    }

    await initWallet();

    submitBtn.addEventListener('click', async () => {
        const inputValue = numberInput.value;

        if (inputValue === '' || !contract) return;

        try {
            statusMsg.textContent = 'Please sign the transaction in MetaMask...';
            statusMsg.style.color = 'var(--text-muted)';
            submitBtn.disabled = true;

            const tx = await contract.set(inputValue);

            statusMsg.textContent = 'Transaction sent! Mining...';
            
            if (txInfo) txInfo.classList.remove('hidden'); 
            if (txLink) {
                txLink.textContent = `${tx.hash}`;
                txLink.href = `https://sepolia.etherscan.io/tx/${tx.hash}`;
            }

            await tx.wait();

            statusMsg.textContent = 'Success! Block confirmed.';
            statusMsg.style.color = 'var(--primary)';
            
            await fetchStoredValue();

        } catch (error) {
            console.error(error);
            if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                statusMsg.textContent = 'Transaction rejected by user.';
            } else {
                statusMsg.textContent = 'Transaction failed.';
            }
            statusMsg.style.color = '#ff3366';
        } finally {
            submitBtn.disabled = false;
            numberInput.value = '';
        }
    });
});
