const container = document.getElementsByClassName("main-container")[0];
const alert = document.getElementsByClassName("alert")[0];
const goal = document.getElementsByClassName("goal")[0];
const progress = document.getElementsByClassName("goal-progress")[0];
const alertUser = document.getElementsByClassName("alert-user")[0];
const alertDonation = document.getElementsByClassName("alert-donation")[0];
const alertMessage = document.getElementsByClassName("alert-message")[0];

let donations = [];
let donationGoal = 0;
let donationSum = 0;
let donationPercent = 0;
let lastDonationDateTime = "";
let audio = new Audio("{alertSound}");

let playAlert = () => {
  if ({ enableAlerts }) {
    alertUser.innerHTML = donations[0].displayName || "Anonymous";
    alertDonation.innerHTML = "$" + donations[0].amount;
    if (donations[0].message != undefined) {
      alertMessage.innerHTML = donations[0].message.substring(0, 150) || "";
    } else {
      alertMessage.innerHTML = "";
    }
    alert.classList.add("alert-show");
    void alert.offsetWidth;
    alert.classList.remove("alert-hide");
    setTimeout(() => {
      alert.classList.add("alert-hide");
      void alert.offsetWidth;
      alert.classList.remove("alert-show");
    }, 8000);
    audio.play();
  }
};

let updateProgress = (percent) => {
  if (percent <= 100) {
    progress.style.height = percent + "%";
  }
};

let sleep = () => {
  return new Promise((resolve) => setTimeout(resolve, 8000));
};

let arrayColumn = (arr, n) => {
  return arr.map((x) => x[n]);
};

let checkForDonation = () => {
  (async () => {
    const response = await fetch(
      "https://extralife.donordrive.com/api/{ExtraLifeType}/" +
        { participantId } +
        "/donations?where=createdDateUTC>%3D%27" +
        donations[0].createdDateUTC +
        "%27"
    );
    const text = await response.text();
    const donos = JSON.parse(text);

    for (let i = 0; i < donos.length; i++) {
      if (
        !arrayColumn(donations, "donationID").includes(donos[i].donationID) &&
        donos[i].createdDateUTC >= donations[0].createdDateUTC
      ) {
        donations.unshift(donos[i]);
        donationSum = donationSum + donations[0].amount;
        let percent = (donationSum / donationGoal) * 100;
        updateProgress(percent);
        playAlert();
        await sleep();
      }
    }

    setTimeout(function () {
      checkForDonation();
    }, 15000);
  })();
};

window.addEventListener("onWidgetLoad", async function (obj) {
  container.classList.toggle("size-{size}");
  goal.classList.toggle("goal-{sideDisplay}");
  alert.classList.toggle("alert-{sideDisplay}");

  (async () => {
    const response = await fetch(
      "https://extralife.donordrive.com/api/{ExtraLifeType}/" +
        { participantId }
    );
    const text = await response.text();
    const obj = JSON.parse(text);

    donationGoal = obj.fundraisingGoal;
    donationSum = obj.sumDonations;
    donationPercent = (donationSum / donationGoal) * 100;
    updateProgress(donationPercent);
  })();

  (async () => {
    const response = await fetch(
      "https://extralife.donordrive.com/api/{ExtraLifeType}/" +
        { participantId } +
        "/donations?limit=10"
    );
    const text = await response.text();
    donations = JSON.parse(text);
  })();

  setTimeout(function () {
    checkForDonation();
  }, 15000);
});

window.addEventListener("onEventReceived", async function (obj) {
  const listener = obj.detail.listener.split("-")[0];
  const event = obj.detail.event;

  if (event.listener === "widget-button" && event.field === "testAlert") {
    playAlert();
  }
});
