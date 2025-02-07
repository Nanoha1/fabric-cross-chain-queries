const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// 连接到Fabric网络
async function connectToNetwork() {
    const ccpPath = path.resolve(__dirname, '../test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json');

    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'admin', // 替换为你的身份名称
        discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('basic');
    return contract;
}

module.exports = { connectToNetwork };
