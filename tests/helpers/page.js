const puppeteer = require("puppeteer");
const sessionFactory = require("../factories/sessionFactory");
const userFactory = require("../factories/userFactory");

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"]
    });
    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get(target, property) {
        return customPage[property] || browser[property] || page[property];
      }
    });
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const { session, sig } = sessionFactory(await userFactory());
    await this.page.setCookie(
      { name: "session", value: session },
      { name: "session.sig", value: sig }
    );
    await this.page.goto("http://localhost:3000/blogs");
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }

  get(url) {
    return this.page.evaluate(url => fetch(url).then(res => res.json()), url);
  }

  post(url, body) {
    return this.page.evaluate(
      async (_url, _body) => {
        const res = await fetch(_url, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(_body)
        });
        const data = await res.json();
        return data;
      },
      url,
      body
    );
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(action => {
        return this[action.method](action.path, action.data);
      })
    );
  }
}

module.exports = CustomPage;
