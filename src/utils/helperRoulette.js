const availableChoices = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "1st",
  "2nd",
  "3rd",
  "1-12",
  "13-24",
  "25-36",
  "1-18",
  "19-36",
  "odd",
  "even",
  "red",
  "black",
];

const columns = {
  "1st": [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  "2nd": [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  "3rd": [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
};

const isEven = (num) => num % 2 === 0;
const isOdd = (num) => !(num % 2 === 0);
const isRed = (num) => num !== 0 && isOdd(num);
const isBlack = (num) => num !== 0 && isEven(num);

const winColumn = (winNum) => {
  if (winNum === 0) return 0;

  switch (true) {
    case columns["1st"].includes(winNum):
      return "1st";

    case columns["2nd"].includes(winNum):
      return "2nd";

    case columns["3rd"].includes(winNum):
      return "3rd";
  }
};

const winHalv = (winNum) => {
  if (winNum === 0) return 0;

  switch (true) {
    case winNum >= 1 && winNum <= 18:
      return "1-18";

    case winNum >= 19 && winNum <= 36:
      return "19-36";

    default:
      return 0;
  }
};

const winDozen = (winNum) => {
  if (winNum === 0) return 0;

  switch (true) {
    case winNum >= 1 && winNum <= 12:
      return "1-12";

    case winNum >= 13 && winNum <= 24:
      return "13-24";

    case winNum >= 25 && winNum <= 36:
      return "25-36";

    default:
      return 0;
  }
};

const defineMultiplierPrize = (bet, winNum) => {
  let multiplier = 0;

  const columWinner = winColumn(winNum);
  const halvWinner = winHalv(winNum);
  const dozenWinner = winDozen(winNum);

  if (columWinner !== 0 && columWinner === bet) multiplier += 3;
  if (dozenWinner !== 0 && dozenWinner === bet) multiplier += 3;
  if (halvWinner !== 0 && halvWinner === bet) multiplier += 2;

  if (bet === "odd" && isOdd(winNum)) multiplier += 2;
  if (bet === "even" && isEven(winNum)) multiplier += 2;

  if (bet === "red" && isRed(winNum)) multiplier += 2;
  if (bet === "black" && isBlack(winNum)) multiplier += 2;

  if (bet === winNum.toString()) multiplier += 36;

  return multiplier;
};

module.exports = {
  availableChoices,
  defineMultiplierPrize,
};
