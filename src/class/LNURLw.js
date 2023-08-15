const Api = require(`./LnbitsApi.js`);
const UserWallet = require("./User.js");
const UserManager = require("./UserManager.js");

class LNURLw extends Api {
  constructor(walletAdminKey) {
    super();
    this.headers = { "X-Api-Key": `${walletAdminKey}` };
    this.urlPath = ``;
  }

  scanLNURL(lnurl) {
    return this.externalApi
      .url(`${this.urlPath}/api/v1/lnurlscan/${lnurl}`)
      .headers(this.headers)
      .get()
      .json();
  }

  async getWithdrawLink(id, discord_id) {
    const um = new UserManager();
    const userWallet = await um.getUserWallet(discord_id);
    const walletAdminKey = userWallet.adminkey;

    return this.externalApi
      .url(`${this.urlPath}/withdraw/api/v1/links/${id}`)
      .headers({ "X-Api-Key": walletAdminKey })
      .get()
      .json();
  }

  createWithdrawlLink(name, amount, uses = 1) {
    return this.externalApi
      .url(`${this.urlPath}/withdraw/api/v1/links`)
      .headers(this.headers)
      .json({
        title: name,
        min_withdrawable: amount,
        max_withdrawable: amount,
        uses,
        wait_time: 1,
        is_unique: true,
      })
      .post()
      .json();
  }

  doCallback(lnurlData) {
    console.log(`attampting to claim LNURL payment`);
    console.log({
      lnurl_callback: lnurlData.callback,
      amount: lnurlData.maxWithdrawable / 1000,
      memo: lnurlData.defaultDescription,
      out: false,
      unit: `sat`,
    });
    return this.externalApi
      .url(`${this.urlPath}/api/v1/payments`)
      .headers(this.headers)
      .json({
        lnurl_callback: lnurlData.callback,
        amount: lnurlData.maxWithdrawable / 1000,
        memo: lnurlData.defaultDescription,
        out: false,
        unit: `sat`,
      })
      .post()
      .json();
  }
}

module.exports = LNURLw;
