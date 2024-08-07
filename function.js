
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

    // Extract the section for en0 interface
    const en0SectionRegex = /en0:\s+.*?(?=\n\w|\Z)/s;
    const en0SectionMatch = en0SectionRegex.exec(stdout);

    if (!en0SectionMatch) {
      throw new Error("No section found for en0 interface");
    }

    const en0Section = en0SectionMatch[0];
    // console.log("en0 Section:\n", en0Section); // Debug output

    // Regex to find the broadcast address and netmask in the en0 section
    const broadcastRegex = /broadcast\s+(\d+\.\d+\.\d+\.\d+)/;
    const netmaskRegex = /netmask\s+(0x[0-9a-fA-F]+)/i;

    const networkDetails = {
      broadcast: null,
      netmask: null,
    };

    // Find broadcast address
    const broadcastMatch = broadcastRegex.exec(en0Section);
    if (broadcastMatch) {
      //   console.log("Broadcast Address:", broadcastMatch[1]);
      networkDetails.broadcast = broadcastMatch[1];
    } else {
      console.log("Broadcast Address not found.");
    }

    // Find netmask
    const netmaskMatch = netmaskRegex.exec(en0Section);
    if (netmaskMatch) {
      //   console.log("Netmask:", netmaskMatch[1]);
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

    //   if (stderr) {
    //     console.error(`stderr: ${stderr}`);
    //     return;
    //   }
      // Output the result
      const result = parseInt(stdout.trim(), 10);
      console.log(`There are ${result} hosts in the network beside you.`);
    }
  );
}

export function calculateCIDRFromBroadcastAndNetmask(broadcast, netmask) {
  // Convert the broadcast address and netmask from string to number
  const broadcastIP = ipToNumber(broadcast);
  const netmaskIP = netmaskToNumber(netmask);

  // Calculate the network address
  const networkIP = broadcastIP & netmaskIP;

  // Calculate the prefix length from the netmask
  const prefixLength = Math.floor(32 - Math.log2(~netmaskIP >>> 0));

  // Convert the network address to string format
  const networkAddress = numberToIP(networkIP);

  // Return the CIDR notation
  return `${networkAddress}/${prefixLength}`;
}

// Helper function to convert IP address from string to number
function ipToNumber(ip) {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

// Helper function to convert netmask from hexadecimal to number
function netmaskToNumber(netmask) {
  // Convert netmask from hexadecimal string to integer
  return parseInt(netmask, 16);
}

// Helper function to convert number to IP address
function numberToIP(number) {
  return [
    (number >>> 24) & 0xff,
    (number >>> 16) & 0xff,
    (number >>> 8) & 0xff,
    number & 0xff,
  ].join(".");
}
