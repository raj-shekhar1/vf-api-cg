'use strict';

var { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');

const util = require('util');

const getCCP = async (org) => {
    let ccpPath;

    switch (org) {
        case "Org1": ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');
            break;
        case "Org2": ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org2.json');
            break;
        case "Org3": ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org3.json');
            break;
        case "Org4": ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org4.json');
            break;
        default:
            return null
    }

    const ccpJSON = fs.readFileSync(ccpPath, 'utf8')
    const ccp = JSON.parse(ccpJSON);
    return ccp

    // if (org == "Org1") {
    //     ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');

    // } else if (org == "Org2") {
    //     ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org2.json');
    // } else
    //     return null
    // const ccpJSON = fs.readFileSync(ccpPath, 'utf8')
    // const ccp = JSON.parse(ccpJSON);
    // return ccp
}

const getCaUrl = async (org, ccp) => {
    let caURL;

    switch (org) {
        case "Org1": caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
            break;
        case "Org2": caURL = ccp.certificateAuthorities['ca.org2.example.com'].url;
            break;
        case "Org3": caURL = ccp.certificateAuthorities['ca.org3.example.com'].url;
            break;
        case "Org4": caURL = ccp.certificateAuthorities['ca.org4.example.com'].url;
            break;
        default:
            return null
    }

    return caURL

    // if (org == "Org1") {
    //     caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;

    // } else if (org == "Org2") {
    //     caURL = ccp.certificateAuthorities['ca.org2.example.com'].url;
    // } else
    //     return null
    // return caURL

}

const getWalletPath = async (org) => {
    let walletPath;

    switch (org) {
        case "Org1": walletPath = path.join(process.cwd(), 'org1-wallet');
            break;
        case "Org2": walletPath = path.join(process.cwd(), 'org2-wallet');
            break;
        case "Org3": walletPath = path.join(process.cwd(), 'org3-wallet');
            break;
        case "Org4": walletPath = path.join(process.cwd(), 'org4-wallet');
            break;
        default:
            return null
    }

    return walletPath

    // if (org == "Org1") {
    //     walletPath = path.join(process.cwd(), 'org1-wallet');

    // } else if (org == "Org2") {
    //     walletPath = path.join(process.cwd(), 'org2-wallet');
    // } else
    //     return null
    // return walletPath

}


const getAffiliation = async (org) => {

    switch (org) {
        case "Org1": return 'org1.department1'
        case "Org2": return 'org2.department1'
        case "Org3": return 'org3.department1'
        case "Org4": return 'org4.department1'
        default: return null
    }

    // return org == "Org1" ? 'org1.department1' : 'org2.department1'
}

const getRegisteredUser = async (username, userOrg, isJson) => {
    let ccp = await getCCP(userOrg)

    const caURL = await getCaUrl(userOrg, ccp)
    const ca = new FabricCAServices(caURL);

    const walletPath = await getWalletPath(userOrg)
    console.log(`Walletpath -- ${walletPath} --`);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const userIdentity = await wallet.get(username);
    if (userIdentity) {
        console.log(`An identity for the user ${username} already exists in the wallet`);
        var response = {
            success: true,
            message: username + ' enrolled Successfully',
        };
        return response
    }

    // Check to see if we've already enrolled the admin user.
    let adminIdentity = await wallet.get('admin@gmail.com');
    if (!adminIdentity) {
        console.log('An identity for the admin user "admin" does not exist in the wallet');
        await enrollAdmin(userOrg, ccp);
        adminIdentity = await wallet.get('admin@gmail.com');
        console.log("Admin Enrolled Successfully")
    }

    // build a user object for authenticating with the CA
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin@gmail.com');
    let secret;
    try {
        // Register the user, enroll the user, and import the new identity into the wallet.
        secret = await ca.register({ affiliation: await getAffiliation(userOrg), enrollmentID: username, role: 'client' }, adminUser);
        // const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: username, role: 'client', attrs: [{ name: 'role', value: 'approver', ecert: true }] }, adminUser);
        console.log('Affiliation for the org--')
        console.log(await getAffiliation(userOrg))
    } catch (error) {
        return error.message
    }

    const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret });
    // const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret, attr_reqs: [{ name: 'role', optional: false }] });

    let x509Identity;

    switch (userOrg) {
        case "Org1": x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
            break;
        case "Org2": x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org2MSP',
            type: 'X.509',
        };
            break;
        case "Org3": x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org3MSP',
            type: 'X.509',
        };
            break;
        case "Org4": x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org4MSP',
            type: 'X.509',
        };
            break;
        default:
            return null
    }


    // if (userOrg == "Org1") {
    //     x509Identity = {
    //         credentials: {
    //             certificate: enrollment.certificate,
    //             privateKey: enrollment.key.toBytes(),
    //         },
    //         mspId: 'Org1MSP',
    //         type: 'X.509',
    //     };
    // } else if (userOrg == "Org2") {
    //     x509Identity = {
    //         credentials: {
    //             certificate: enrollment.certificate,
    //             privateKey: enrollment.key.toBytes(),
    //         },
    //         mspId: 'Org2MSP',
    //         type: 'X.509',
    //     };
    // }

    await wallet.put(username, x509Identity);
    console.log(`Successfully registered and enrolled admin user ${username} and imported it into the wallet`);

    var response = {
        success: true,
        message: username + ' enrolled Successfully',
    };
    return response
}

const isUserRegistered = async (username, userOrg) => {
    const walletPath = await getWalletPath(userOrg)
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const userIdentity = await wallet.get(username);
    if (userIdentity) {
        console.log(`An identity for the user ${username} exists in the wallet`);
        return true
    }
    return false
}


const getCaInfo = async (org, ccp) => {
    let caInfo

    switch (org) {
        case "Org1": caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
            break;
        case "Org2": caInfo = ccp.certificateAuthorities['ca.org2.example.com'];
            break;
        case "Org3": caInfo = ccp.certificateAuthorities['ca.org3.example.com'];
            break;
        case "Org4": caInfo = ccp.certificateAuthorities['ca.org4.example.com'];
            break;
        default:
            return null
    }

    return caInfo

    // if (org == "Org1") {
    //     caInfo = ccp.certificateAuthorities['ca.org1.example.com'];

    // } else if (org == "Org2") {
    //     caInfo = ccp.certificateAuthorities['ca.org2.example.com'];
    // } else
    //     return null
    // return caInfo

}

const enrollAdmin = async (org, ccp) => {

    console.log('calling enroll Admin method')

    try {

        const caInfo = await getCaInfo(org, ccp) //ccp.certificateAuthorities['ca.org1.example.com'];

        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
        console.log(`cainfo: ${ca}`, ccp);
        // Create a new file system based wallet for managing identities.
        const walletPath = await getWalletPath(org) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get('admin@gmail.com');
        if (identity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin@gmail.com', enrollmentSecret: 'adminpw' });
        let x509Identity;
        switch (org) {
            case "Org1": x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'Org1MSP',
                type: 'X.509',
            };
                break;
            case "Org2": x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'Org2MSP',
                type: 'X.509',
            };
                break;
            case "Org3": x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'Org3MSP',
                type: 'X.509',
            };
                break;
            case "Org4": x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'Org4MSP',
                type: 'X.509',
            };
                break;
            default:
                return null
        }

        await wallet.put('admin@gmail.com', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
        return
    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
    }
}

const registerAndGerSecret = async (username, userOrg) => {
    let ccp = await getCCP(userOrg)

    const caURL = await getCaUrl(userOrg, ccp)
    const ca = new FabricCAServices(caURL);

    const walletPath = await getWalletPath(userOrg)
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const userIdentity = await wallet.get(username);
    if (userIdentity) {
        console.log(`An identity for the user ${username} already exists in the wallet`);
        var response = {
            success: true,
            message: username + ' enrolled Successfully',
        };
        return response
    }

    // Check to see if we've already enrolled the admin user.
    let adminIdentity = await wallet.get('admin@gmail.com');
    if (!adminIdentity) {
        console.log('An identity for the admin user "admin" does not exist in the wallet');
        await enrollAdmin(userOrg, ccp);
        adminIdentity = await wallet.get('admin@gmail.com');
        console.log("Admin Enrolled Successfully")
    }

    // build a user object for authenticating with the CA
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin@gmail.com');
    let secret;
    try {
        // Register the user, enroll the user, and import the new identity into the wallet.
        secret = await ca.register({ affiliation: await getAffiliation(userOrg), enrollmentID: username, role: 'client' }, adminUser);
        // const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: username, role: 'client', attrs: [{ name: 'role', value: 'approver', ecert: true }] }, adminUser);

    } catch (error) {
        return error.message
    }

    var response = {
        success: true,
        message: username + ' enrolled Successfully',
        secret: secret
    };
    return response

}

exports.getRegisteredUser = getRegisteredUser

module.exports = {
    getCCP: getCCP,
    getWalletPath: getWalletPath,
    getRegisteredUser: getRegisteredUser,
    isUserRegistered: isUserRegistered,
    registerAndGerSecret: registerAndGerSecret

}
