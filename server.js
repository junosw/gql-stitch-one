const express = require('express')
const graphqlHTTP = require('express-graphql')
const { makeExecutableSchema } = require('graphql-tools')
const { find, filter, concat } = require('lodash')

const typeDefs = `
  interface Child {
    id: Int!
    name: String
  }

  type SingerChild implements Child {
    id: Int!
    name: String
    genre: String!
  }

  type SongwriterChild implements Child {
    id: Int!
    name: String
    bestSong: String!
  }

  type Author {
    id: Int!
    firstName: String
    lastName: String
    posts: [Post] 
    children: [Child]
  }

  type Post {
    id: Int!
    title: String
    author: Author
    votes: Int
  }

  # the schema allows the following query:
  type Query {
    posts: [Post]
    author(id: Int!): Author
    singers: [Child]
    songwriters: [Child]
  }
  
  # this schema allows the following mutation:
  type Mutation {
    upvotePost (
      postId: Int!
    ): Post
  }
`

const singers = [
  { id: 1, parent: 1, name: 'Bob', genre: 'Rock' },
  { id: 2, parent: 1, name: 'Nemo', genre: 'Blues' },
  { id: 3, parent: 3, name: 'Ariel', genre: 'Jazz' }
]

const songWriters = [
  { id: 1, parent: 1, name: 'Alice', bestSong: 'You' },
  { id: 2, parent: 3, name: 'Jeff', bestSong: 'Maybe' },
  { id: 3, parent: 2, name: 'Stoic', bestSong: 'Win' }
]

const authors = [
  { id: 1, firstName: 'Tom', lastName: 'Coleman' },
  { id: 2, firstName: 'Sashko', lastName: 'Stubailo' },
  { id: 3, firstName: 'Mikhail', lastName: 'Novikov' }
]
const posts = [
  { id: 1, authorId: 1, title: 'Introduction to GraphQL', votes: 2 },
  { id: 2, authorId: 2, title: 'Welcome to Meteor', votes: 3 },
  { id: 3, authorId: 2, title: 'Advanced GraphQL', votes: 1 },
  { id: 4, authorId: 3, title: 'Launchpad is Cool', votes: 7 }
]
const resolvers = {
  Query: {
    posts: () => posts,
    author: (_, { id }) => find(authors, { id: id }),
    singers: () => singers,
    songwriters: () => songWriters
  },
  Mutation: {
    upvotePost: (_, { postId }) => {
      const post = find(posts, { id: postId })
      if (!post) {
        throw new Error(`Couldn't find post with id ${postId}`)
      }
      post.votes += 1
      return post
    }
  },
  Author: {
    posts: author => filter(posts, { authorId: author.id }),
    children: author =>
      concat(
        filter(singers, { parent: author.id }),
        filter(songWriters, { parent: author.id })
      )
  },
  Post: {
    author: post => find(authors, { id: post.authorId })
  },
  Child: {
    __resolveType(obj, context, info) {
      if (obj.genre) {
        return 'SingerChild'
      } else if (obj.bestSong) {
        return 'SongwriterChild'
      }
      return null
    }
  }
}
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

var app = express()
app.use(
  '/graphql',
  graphqlHTTP({
    schema: schema,
    graphiql: true
  })
)

app.listen(3000)
console.log('Server started on port 3000')
