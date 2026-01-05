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

    async function initWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                provider = new ethers.providers.Web3Provider(window.ethereum);
                
                await provider.send("eth_requestAccounts", []);
                
                signer = provider.getSigner();
                contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
                
                statusMsg.textContent = 'Wallet Connected.';
                statusMsg.style.color = 'var(--primary)';
                
                fetchStoredValue();

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

    await initWallet();

    async function fetchStoredValue() {
        if (!contract) return;
        
        try {
            const currentVal = await contract.get();
            displayValue.textContent = currentVal.toString();
        } catch (error) {
            console.error("Error fetching value:", error);
        }
    }

        submitBtn.addEventListener('click', async () => {
        const inputValue = numberInput.value;
        const txInfo = document.getElementById('tx-info'); // NEW
        const txLink = document.getElementById('tx-link'); // NEW

        if (inputValue === '' || !contract) return;

        try {
            statusMsg.textContent = 'Please sign the transaction in MetaMask...';
            statusMsg.style.color = 'var(--text-muted)';
            submitBtn.disabled = true;

            const tx = await contract.set(inputValue);

            statusMsg.textContent = 'Transaction sent! Mining...';
            
            txInfo.classList.remove('hidden'); 
            txLink.textContent = tx.hash;      
            
            txLink.href = `https://sepolia.etherscan.io/tx/${tx.hash}`;

            await tx.wait();

            statusMsg.textContent = 'Success! Block confirmed.';
            statusMsg.style.color = 'var(--primary)';
            
            await fetchStoredValue();

        } catch (error) {
            console.error(error);
            statusMsg.textContent = 'Transaction failed or rejected.';
            statusMsg.style.color = '#ff3366';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Store Number';
                numberInput.value = '';
            }
        });
    });

