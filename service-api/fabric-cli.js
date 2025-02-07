const { exec } = require('child_process');

// 封装调用链码的函数
function invokeChaincode(functionName, args, callback) {
    const command = `
        peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
        --tls --cafile /home/damon/fb/fabric-samples-main/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt \
        -C mychannel -n basic \
        --peerAddresses localhost:7051 \
        --tlsRootCertFiles /home/damon/fb/fabric-samples-main/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
        --peerAddresses localhost:9051 \
        --tlsRootCertFiles /home/damon/fb/fabric-samples-main/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
        -c '{"function":"${functionName}","Args":[${args.map(arg => `"${arg}"`).join(',')}]}'
    `;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            callback(`Error: ${error.message}`, null);
            return;
        }
        // 忽略非错误的stderr输出
        if (stderr && !stderr.includes('Error')) {
            stderr = null;
        }
        if (stderr) {
            callback(`Stderr: ${stderr}`, null);
            return;
        }
        callback(null, stdout);
    });
}

function queryChaincode(functionName, args, callback) {
    const command = `
        peer chaincode query -C mychannel -n basic \
        -c '{"function":"${functionName}","Args":[${args.map(arg => `"${arg}"`).join(',')}]}'
    `;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            callback(`Error: ${error.message}`, null);
            return;
        }
        // 忽略非错误日志信息
        if (stderr && !stderr.includes('Error')) {
            stderr = null;
        }
        if (stderr) {
            callback(`Stderr: ${stderr}`, null);
            return;
        }
        try {
            const result = JSON.parse(stdout.trim());
            callback(null, result);
        } catch (err) {
            callback(`Error parsing response: ${err.message}`, null);
        }
    });
}

module.exports = { invokeChaincode, queryChaincode };
