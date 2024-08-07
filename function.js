
import { exec } from "node:child_process";
import util from "util";

const execPromise = util.promisify(exec);


export async function getNetworkDetails() {
  try {
    const { stdout, stderr } = await execPromise("ifconfig");

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      throw new Error(stderr);
    }

    const en0SectionRegex = /en0:\s+.*?(?=\n\w|\Z)/s;
    const en0SectionMatch = en0SectionRegex.exec(stdout);

    if (!en0SectionMatch) {
      throw new Error("No section found for en0 interface");
    }

    const en0Section = en0SectionMatch[0];

    const broadcastRegex = /broadcast\s+(\d+\.\d+\.\d+\.\d+)/;
    const netmaskRegex = /netmask\s+(0x[0-9a-fA-F]+)/i;

    const networkDetails = {
      broadcast: null,
      netmask: null,
    };

    const broadcastMatch = broadcastRegex.exec(en0Section);
    if (broadcastMatch) {
      networkDetails.broadcast = broadcastMatch[1];
    } else {
      console.log("Broadcast Address not found.");
    }

    const netmaskMatch = netmaskRegex.exec(en0Section);
    if (netmaskMatch) {
      networkDetails.netmask = netmaskMatch[1];
    } else {
      console.log("Netmask not found.");
    }

    return networkDetails;
  } catch (error) {
    console.error("Failed to get network details:", error);
    throw error;
  }
}

export function otherHostsReport(CIDRNotation) {
  console.log(
    "We are displaying the hosts in the network beside you, please wait..."
  );
  console.log(CIDRNotation)
  exec(
    `fping -a -q -g ${CIDRNotation} | grep -v \"duplicate\" | wc -l | awk '{print $1-1}'`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }

      // Output the result
      const result = parseInt(stdout.trim(), 10);
      console.log(`There are ${result} hosts in the network beside you.`);
    }
  );
}

export function calculateCIDRFromBroadcastAndNetmask(broadcast, netmask) {
  const broadcastIP = ipToNumber(broadcast);
  const netmaskIP = netmaskToNumber(netmask);

  const networkIP = broadcastIP & netmaskIP;

  const prefixLength = Math.floor(32 - Math.log2(~netmaskIP >>> 0));

  const networkAddress = numberToIP(networkIP);

  return `${networkAddress}/${prefixLength}`;
}

function ipToNumber(ip) {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

function netmaskToNumber(netmask) {
  return parseInt(netmask, 16);
}

function numberToIP(number) {
  return [
    (number >>> 24) & 0xff,
    (number >>> 16) & 0xff,
    (number >>> 8) & 0xff,
    number & 0xff,
  ].join(".");
}
