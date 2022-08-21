import { faker } from '@faker-js/faker'

interface Post {
  contents: string
}

function generatePosts (count: number): Post[] {
  const newPosts: Post[] = []
  for (let i = 0; i < count; i++) {
    newPosts.push({
      contents: faker.lorem.text()
    })
  }

  return newPosts
}

export {
  generatePosts
}
