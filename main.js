import {
  getNetworkDetails,
  otherHostsReport,
  calculateCIDRFromBroadcastAndNetmask,
} from "./function.js";

async function main() {
  const network = await getNetworkDetails();
  // console.log(network);
  const CIDRNotation = calculateCIDRFromBroadcastAndNetmask(
    network.broadcast,
    network.netmask
  );
  otherHostsReport(CIDRNotation);
}

main();
