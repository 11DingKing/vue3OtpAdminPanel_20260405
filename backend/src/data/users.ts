export interface User {
  id: string;
  username: string;
  password: string;
  nickname: string;
  email: string;
  role: "admin" | "user";
  permissions: string[];
  totpSecret: string;
}

export const users: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    nickname: "系统管理员",
    email: "admin@example.com",
    role: "admin",
    permissions: ["dashboard", "users", "settings", "profile"],
    totpSecret: "JBSWY3DPEHPK3PXP",
  },
  {
    id: "2",
    username: "user",
    password: "user123",
    nickname: "普通用户",
    email: "user@example.com",
    role: "user",
    permissions: ["dashboard", "profile"],
    totpSecret: "KRSXG5DPOJQXGZJT",
  },
];

export function findUserByUsername(username: string): User | undefined {
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}
