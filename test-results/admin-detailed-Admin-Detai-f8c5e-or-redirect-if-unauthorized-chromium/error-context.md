# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - status [ref=e3]
  - navigation [ref=e5]:
    - generic [ref=e7]:
      - link "PawSocial" [ref=e8] [cursor=pointer]:
        - /url: /
        - img [ref=e9]
        - generic [ref=e14]: PawSocial
      - generic [ref=e16]:
        - link "Login" [ref=e17] [cursor=pointer]:
          - /url: /login/
          - button "Login" [ref=e18]:
            - img
            - text: Login
        - link "Sign Up" [ref=e19] [cursor=pointer]:
          - /url: /register/
          - button "Sign Up" [ref=e20]:
            - img
            - text: Sign Up
  - status "Loading" [ref=e23]
```