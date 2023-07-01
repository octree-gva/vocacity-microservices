import * as bcrypt from "bcrypt";
import { ServiceBroker } from "moleculer";
import UsersDataService from "../../../services/users-data.service";

describe("Test 'users-data' service", () => {
  const broker = new ServiceBroker({
    logger: false,
  });

  const service = broker.createService(UsersDataService);
  const EXISTING_USER = {
    email: "testuser@example.com",
    password: "password123",
  };

  beforeAll(async () => {
    await broker.start();

    // create user with hashed password
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashed = await bcrypt.hash(EXISTING_USER.password, salt);
    await service.adapter.insert({ email: EXISTING_USER.email, password: hashed });
  }, 30000);

  afterAll(async () => broker.stop());

  describe("Test 'users-data.login' action", () => {
    test("should return user object on successful login", async () => {
      // attempt login with correct credentials
      const res: any = await broker.call("users-data.login", EXISTING_USER);

      expect(res).toHaveProperty("id");
      expect(res).toHaveProperty("email", EXISTING_USER.email);
      expect(res).toHaveProperty("code", 200);
    });

    test("should return a 404 error on login failure", async () => {
      const { email } = EXISTING_USER;
      const password = "wrongPassword";

      // attempt login with incorrect credentials
      const res: any = await broker.call("users-data.login", { email, password });
      expect(res).toHaveProperty("code", 404);
      expect(res.i18nMessage).toMatch(/not_found/);
    });
  });

  describe("Test 'users-data.register' action", () => {
    test("should return user object on successful registration", async () => {
      // attempt login with correct credentials
      const res: any = await broker.call("users-data.register", {
        email: "users-data.register@random.com",
        password: "random",
      });
      expect(res).toHaveProperty("id");
      expect(res).toHaveProperty("email", "users-data.register@random.com");
      expect(res).toHaveProperty("code", 200);
    });

    test("should return a 400 error with a uniq message if email is already existing", async () => {
      const res: any = await broker.call("users-data.register", EXISTING_USER);
      expect(res).toHaveProperty("code", 400);
      expect(res.message).toMatch(/unique/);
    });
    test("should raises an error if email is mal formated", async () => {
      await expect(async () => {
        await broker.call("users-data.register", {
          email: "not-an-email",
          password: "Hello",
        });
      }).rejects.toThrow();
    });
  });
});
