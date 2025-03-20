import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth
    }
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log(credentials)



        if (credentials.username !== "1") {
          return null
        }




        

        return {
          id: 1,
          name: "test",
          email: "test@test.com"
        }
      }
    })
  ]
})
