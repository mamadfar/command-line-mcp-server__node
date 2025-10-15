import { writeFile } from "fs/promises";

export interface ICreateUserParams {
  id?: number;
  name: string;
  email: string;
  address: string;
  phone: string;
}

export const getUsers = async () => {
  const users: ICreateUserParams[] = await import("../db/users.json", {
    with: { type: "json" },
  }).then((module) => module.default);
  return users;
};

export const createUser = async (user: ICreateUserParams) => {
  const users = await getUsers();
  const id = users.length + 1;
  users.push({ id, ...user });
  await writeFile("./src/lib/db/users.json", JSON.stringify(users, null, 2));
  return id;
};
