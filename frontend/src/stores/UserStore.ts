import { observable, decorate } from "mobx";

import { RequestState } from "types/RequestState";

export interface IUser {
  id: number;
  email: string;
  grant: number;
  name: string;
  token: string;
  avatar_url: string | null;
}

class UserStore {
  user: IUser = null;
  state = RequestState.PENDING;

  loginVk = (code: string) => {
    console.log("[UserStore] loginVk called with code:", code);
    this.state = RequestState.LOADING;

    const url = `${process.env.REACT_APP_API_HOST}/auth/login/vk`;
    const body = { code };
    console.log("[UserStore] POST", url, "body:", body);

    return fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    })
        .then(async (res) => {
          console.log("[UserStore] Response status:", res.status);
          const text = await res.text();
          console.log("[UserStore] Raw response body:", text);

          if (res.ok) {
            const json = JSON.parse(text);
            console.log("[UserStore] Parsed JSON:", json);
            return json;
          } else {
            this.setError();
            return Promise.reject(new Error(`HTTP ${res.status}`));
          }
        })
        .then((user) => {
          console.log("[UserStore] loginVk successful, user:", user);
          this.setUser(user);
          return user;
        })
        .catch((err) => {
          console.error("[UserStore] loginVk failed:", err);
          throw err;
        });
  };

  getProfile = () => {
    this.state = RequestState.LOADING;
    const token = sessionStorage.getItem("token");

    if (!token) Promise.reject();

    return fetch(`${process.env.REACT_APP_API_HOST}/users/profile`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        switch (res.status) {
          case 200:
          case 201:
            return res.json();
          default:
            this.setError();
            return Promise.reject();
        }
      })
      .then((user) => this.setUser(user));
  };

  logout = () => {
    this.user = null;
    sessionStorage.clear();
    this.state = RequestState.PENDING;
  };

  setUser = (user: IUser) => {
    this.user = user;
    this.state = RequestState.SUCCESS;

    if (user["token"]) {
      sessionStorage.setItem("token", user.token);
    }
  };

  setError = () => {
    this.state = RequestState.ERROR;
  };
}

decorate(UserStore, {
  user: observable,
  state: observable,
});

export default new UserStore();
