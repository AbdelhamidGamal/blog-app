const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  await page.close();
});

describe("When logged in", () => {
  beforeEach(async () => {
    await page.login();
    await page.click('a[href="/blogs/new"]');
  });

  test("can see blog create form", async () => {
    const title = await page.getContentsOf(".title label");
    expect(title).toBe("Blog Title");
  });

  describe("and using invalid inputs", () => {
    beforeEach(async () => {
      await page.click('form button[type="submit"]');
    });

    test("the form shows error messsage", async () => {
      const titleError = await page.getContentsOf(".title .red-text");
      const contentError = await page.getContentsOf(".content .red-text");
      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });

  describe("when using valid inputs", () => {
    beforeEach(async () => {
      await page.focus('input[name="title"]');
      await page.keyboard.type("blogpost title");
      await page.focus('input[name="content"]');
      await page.keyboard.type("blogpost body");
      await page.click('form button[type="submit"]');
    });

    test("submiting takes user to review screen", async () => {
      const h5 = await page.getContentsOf("h5");
      expect(h5).toEqual("Please confirm your entries");
    });

    test("confirming inputs add post to blog index", async () => {
      await page.click("button.right");
      await page.waitFor(".card");
      const title = await page.getContentsOf(".card-title");
      const content = await page.getContentsOf(".card-content p");
      expect(title).toEqual("blogpost title");
      expect(content).toEqual("blogpost body");
    });
  });
});

describe("When user is not logged in", () => {
  const actions = [
    {
      method: "post",
      path: "/api/blogs",
      data: {
        title: "my post",
        content: "post content"
      }
    },
    {
      method: "get",
      path: "/api/blogs"
    }
  ];

  test("blog related actions are prohibited", async () => {
    const results = await page.execRequests(actions);
    for (let result of results) {
      expect(result).toEqual({ error: "You must log in!" });
    }
  });
});
