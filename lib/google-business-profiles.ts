export type GoogleBusinessStatus =
  | "Active"
  | "Pending"
  | "Suspended"
  | "Appeal Pending"
  | "Verification Required";

export type GoogleBusinessProfile = {
  status: GoogleBusinessStatus;
  mapsUrl?: string;
};

const profile = (status: GoogleBusinessStatus, mapsUrl?: string): GoogleBusinessProfile => ({ status, mapsUrl });

// Supplied GBP register. Active records take precedence where duplicates exist.
export const googleBusinessProfiles: Record<string, GoogleBusinessProfile> = {
  melbourne: profile("Active", "https://maps.app.goo.gl/Djwra7xumDAGfAvY9"),
  stalbans: profile("Active", "https://maps.app.goo.gl/aN541RAdK5NuVxMG9"),
  southmelbourne: profile("Active", "https://maps.app.goo.gl/nAJPyVY2Gw8Ud6Up9"),
  pakenham: profile("Active", "https://maps.app.goo.gl/s8QjpEHC8con1S187"),
  ballarat: profile("Active", "https://maps.app.goo.gl/s3K75W7gmwNJgBZx6"),
  bendigo: profile("Active", "https://maps.app.goo.gl/Azuu4JWB6xXGFZhu9"),
  geelong: profile("Active", "https://maps.app.goo.gl/R8Xtj3KDWGwVu1uQA"),
  melton: profile("Active", "https://maps.app.goo.gl/kqjMuh6rhYo9hzty8"),
  pointcook: profile("Active", "https://maps.app.goo.gl/CuJAUcQdpTCqsBv3A"),
  reservoir: profile("Active", "https://maps.app.goo.gl/gBD4qveRkyxyb8eN9"),
  richmond: profile("Active", "https://maps.app.goo.gl/ytFph1biadDL3s219"),
  stkilda: profile("Active", "https://maps.app.goo.gl/Cbk5Cr9nGEeEbMkYA"),
  epping: profile("Active", "https://maps.app.goo.gl/EDwztfM8mv4HcF6c8"),
  footscray: profile("Active", "https://maps.app.goo.gl/qpkK2w4YFYE4XB5Q7"),
  glenwaverley: profile("Active", "https://maps.app.goo.gl/9B9M5pMpcvjW1yUv8"),
  fitzroy: profile("Active", "https://maps.app.goo.gl/MSt1iptTvWfHcsom8"),
  boxhill: profile("Active", "https://maps.app.goo.gl/Viv2FQofxhmU1J3n7"),
  hawthorn: profile("Active", "https://maps.app.goo.gl/t7VQroTDq5v1SMKU6"),
  essendon: profile("Active", "https://maps.app.goo.gl/M4PyFgG4HjXTEhEE9"),
  ringwood: profile("Active", "https://maps.app.goo.gl/BM4cyYAsgcdWaUdQ8"),
  brighton: profile("Active", "https://maps.app.goo.gl/2ALY1akwHoqKQQFz8"),
  narrewarren: profile("Pending", "https://maps.app.goo.gl/tTkGHWbmZUafW6wS6"),
  mornington: profile("Suspended", "https://maps.app.goo.gl/vDM7hsrH4YhoWbWL6"),
  brunswick: profile("Active", "https://maps.app.goo.gl/Wkt1AyBrVi2gwBPx8"),
  dandenong: profile("Active", "https://maps.app.goo.gl/9KDuYtwmWiSXMzbr7"),
  frankston: profile("Pending", "https://maps.app.goo.gl/nK6Bvr4a1xE1DKit5"),
  kew: profile("Active", "https://maps.app.goo.gl/t9MJGHZQ8o8Ftx1CA"),
  carolinesprings: profile("Verification Required", "https://maps.app.goo.gl/mYVG6D2JbAtU1HMJA"),
  williamstown: profile("Active", "https://maps.app.goo.gl/ShBbxc2mZi3Eu5oAA"),
  kensington: profile("Appeal Pending"),
  blackburn: profile("Active", "https://maps.app.goo.gl/2iWz2QCNAJCyFLJS7"),
  thornbury: profile("Active", "https://maps.app.goo.gl/6ZbrSNhzsAMeAP7UA"),
  craigieburn: profile("Active", "https://maps.app.goo.gl/cA7KeuWUTvYProh59"),
  northmelbourne: profile("Active", "https://maps.app.goo.gl/eKwx8yuTZLYVnL1M7"),
  berwick: profile("Active", "https://maps.app.goo.gl/bGRfJNpDdm9uWogs8"),
  hopperscrossing: profile("Suspended", "https://maps.app.goo.gl/naBZ63hYG6CdqrTQA"),
  altona: profile("Suspended", "https://maps.app.goo.gl/t7YDy8oReaHpRKSk9"),
  bentleigh: profile("Suspended", "https://maps.app.goo.gl/YxzjfMQNDQow2RqC8"),
  moorabbin: profile("Active", "https://maps.app.goo.gl/SoJGUD6aKmmmZ6sV7"),
  bundoora: profile("Active", "https://maps.app.goo.gl/XCgxowc2niNnN9JP6"),
  preston: profile("Active", "https://maps.app.goo.gl/a7LXTwqDUfkxJxqM8"),
  doncaster: profile("Suspended", "https://maps.app.goo.gl/KvNtRMz48MmsBP2i6"),
  northcote: profile("Appeal Pending", "https://maps.app.goo.gl/fDEEZ8BdQBaCGth29"),
  coburg: profile("Active", "https://maps.app.goo.gl/jL565Tbas8uDsopM6"),
  cremorne: profile("Appeal Pending", "https://maps.app.goo.gl/TLYrtD6PRdVZonjt8"),
  werribee: profile("Suspended", "https://maps.app.goo.gl/rHQxWWsvwNT7SBua7?g_st=ic"),
  camberwell: profile("Suspended", "https://maps.app.goo.gl/NYv6Vn4ysS9zeg7G8"),
  sunbury: profile("Suspended", "https://maps.app.goo.gl/oShyMZpk1BdUbjXm7"),
  sunshine: profile("Suspended"),
  portmelbourne: profile("Suspended", "https://maps.app.goo.gl/kg4fFytXM4bgtks79"),
  balwyn: profile("Verification Required", "https://maps.app.goo.gl/nmazVgqeHEcDtSxy7"),
  carlton: profile("Verification Required", "https://maps.app.goo.gl/chZCnRA7FgJhHkWx5"),
  tarneit: profile("Active", "https://maps.app.goo.gl/ASyiPSrV1cPj7gWdA"),
  cheltenham: profile("Active", "https://maps.app.goo.gl/Zs1AVEo82RYhwEeZ9"),
  newport: profile("Suspended"),
  templestowe: profile("Suspended"),
  hampton: profile("Active", "https://maps.app.goo.gl/yQxv7PNs64JkyPoq9"),
  lalor: profile("Active", "https://maps.app.goo.gl/na36iVTGfm4wwX4c7"),
  millpark: profile("Active", "https://maps.app.goo.gl/hvaRzwJre9mBjCkF9"),
  bulleen: profile("Active", "https://maps.app.goo.gl/NDKwCkGrb8851oZe8"),
  malvern: profile("Pending"),
  prahran: profile("Active", "https://maps.app.goo.gl/JBPGP8cBrUVQD2wf7"),
  montalbert: profile("Pending"),
  burwood: profile("Pending"),
  springvale: profile("Active", "https://maps.app.goo.gl/cjZr2eTSn8F9M3WS8"),
  cliftonhill: profile("Active", "https://maps.app.goo.gl/ScoPckZjeAxB3YW49"),
  deanside: profile("Active", "https://maps.app.goo.gl/QWUdRysa2sZAvZwU6"),
  mountwaverley: profile("Active", "https://maps.app.goo.gl/qXNsxJVrsJZwr9sg7"),
  strathmore: profile("Pending"),
  thomastown: profile("Active", "https://maps.app.goo.gl/PDGMYdk57VMnZJsa9"),
  toorak: profile("Active", "https://maps.app.goo.gl/t6LSg3mTcYASNefz8"),
  chadstone: profile("Pending"),
  cranbourne: profile("Active", "https://maps.app.goo.gl/5cViJrGKK3RnvRsb7"),
  wantirna: profile("Active", "https://maps.app.goo.gl/4qjKrtQxGEGG1uS67"),
  bayswater: profile("Active", "https://maps.app.goo.gl/iQY1VJK7wchUqWP49"),
  greenvale: profile("Verification Required"),
  ferntreegully: profile("Pending"),
  yarraville: profile("Active", "https://maps.app.goo.gl/vuD1ZPVA14EFHu9a7"),
  seaford: profile("Pending"),
  southyarra: profile("Pending"),
  ascotvale: profile("Pending"),
  southmorang: profile("Pending"),
};

export function publicMapsUrl(profile?: GoogleBusinessProfile) {
  return profile?.status === "Active" ? profile.mapsUrl : undefined;
}
