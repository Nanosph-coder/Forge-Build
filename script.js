const CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";
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
                
                await provider.send("eth_requestAccounts", []);
                
                signer = await provider.getSigner();
                contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
                
                statusMsg.textContent = 'Wallet Connected.';
                statusMsg.style.color = 'var(--primary)';
                
                await fetchStoredValue();

            } catch (error) {
                console.error(error);
                statusMsg.textContent = 'Connection denied or error.';
                statusMsg.style.color = '#ff3366';
            }
        } else {
            statusMsg.textContent = 'Please install MetaMask!';
            statusMsg.style.color = '#ff3366';
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
                txLink.textContent = `${tx.hash.substring(0, 10)}...`;
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
