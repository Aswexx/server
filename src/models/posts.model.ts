/* eslint-disable no-useless-constructor */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const postSelector = {
  id: true,
  contents: true,
  createdAt: true,
  liked: true,
  comments: {
    select: {
      id: true,
      contents: true,
      createdAt: true,
      media: {
        select: { url: true, type: true }
      },
      author: {
        select: {
          name: true,
          alias: true,
          avatarUrl: true
        }
      },
      liked: {
        select: { userId: true }
      }
    }
  },
  author: {
    select: {
      id: true,
      name: true,
      alias: true,
      avatarUrl: true
    }
  }
}

async function getPosts (skip: number, take: number, order: string) {
  const postCount = await prisma.post.count()

  const orderRule =
    order === 'newest'
      ? 'desc'
      : 'asc'

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      contents: true,
      createdAt: true,
      liked: true,
      media: {
        select: {
          url: true,
          type: true
        }
      },
      mention: {
        select: {
          mentionedUserId: true,
          mentionedUser: {
            select: {
              alias: true
            }
          }
        }
      },
      comments: {
        select: {
          _count: true,
          id: true,
          contents: true,
          createdAt: true,
          onPost: {
            select: {
              id: true,
              author: {
                select: {
                  name: true,
                  alias: true
                }
              }
            }
          },
          mention: {
            select: {
              mentionedUserId: true,
              mentionedUser: {
                select: {
                  alias: true
                }
              }
            }
          },
          media: {
            select: { url: true, type: true }
          },
          author: {
            select: {
              name: true,
              alias: true,
              avatarUrl: true
            }
          },
          liked: {
            select: { userId: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      author: {
        select: {
          id: true,
          name: true,
          alias: true,
          avatarUrl: true
        }
      }
    },
    orderBy: { createdAt: orderRule },
    skip,
    take
  })

  return { posts, postCount }
}

async function getUserLikePosts (userId: string) {
  try {
    const posts = await prisma.likePost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: { select: { alias: true, avatarUrl: true } },
            media: {
              select: {
                type: true,
                url: true
              }
            },
            liked: true,
            comments: {
              include: {
                author: { select: { alias: true, avatarUrl: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return posts
  } catch (error) {
    console.error(error)
  }
}

async function getPostsByKeyword (keyword: string) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        contents: {
          contains: keyword,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        contents: true,
        createdAt: true,
        liked: true,
        media: {
          select: {
            url: true,
            type: true
          }
        },
        comments: {
          select: {
            id: true,
            contents: true,
            createdAt: true,
            media: {
              select: { url: true, type: true }
            },
            author: {
              select: {
                name: true,
                alias: true,
                avatarUrl: true
              }
            },
            liked: {
              select: { userId: true }
            }
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            alias: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    await prisma.$disconnect()
    return { posts, postCount: posts.length }
  } catch (err) {
    console.error(err)
    await prisma.$disconnect()
  }
}

async function getPostsByMostComments (skip: number, take: number) {
  const postCount = await prisma.post.count()

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      contents: true,
      createdAt: true,
      liked: true,
      media: {
        select: {
          url: true,
          type: true
        }
      },
      comments: {
        select: {
          id: true,
          contents: true,
          createdAt: true,
          media: {
            select: { url: true, type: true }
          },
          author: {
            select: {
              name: true,
              alias: true,
              avatarUrl: true
            }
          },
          liked: {
            select: { userId: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      author: {
        select: {
          id: true,
          name: true,
          alias: true,
          avatarUrl: true
        }
      }
    },
    skip,
    take,
    orderBy: { comments: { _count: 'desc' } }
  })

  return { posts, postCount }
}

async function getPostsByMostLiked (skip: number, take: number) {
  const postCount = await prisma.post.count()

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      contents: true,
      createdAt: true,
      liked: true,
      media: {
        select: {
          url: true,
          type: true
        }
      },
      comments: {
        select: {
          id: true,
          contents: true,
          createdAt: true,
          media: {
            select: { url: true, type: true }
          },
          author: {
            select: {
              name: true,
              alias: true,
              avatarUrl: true
            }
          },
          liked: {
            select: { userId: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      author: {
        select: {
          id: true,
          name: true,
          alias: true,
          avatarUrl: true
        }
      }
    },
    skip,
    take,
    orderBy: { liked: { _count: 'desc' } }
  })
  return { posts, postCount }
}

async function getUserPosts (userId: string, skip: number = 0) {
  const result = prisma.post.findMany({
    where: { authorId: userId },
    select: {
      id: true,
      contents: true,
      createdAt: true,
      liked: true,
      media: {
        select: {
          url: true,
          type: true
        }
      },
      mention: {
        select: {
          mentionedUserId: true,
          mentionedUser: {
            select: {
              alias: true
            }
          }
        }
      },
      comments: {
        select: {
          _count: true,
          id: true,
          contents: true,
          createdAt: true,
          onPost: {
            select: {
              id: true,
              author: {
                select: {
                  name: true,
                  alias: true
                }
              }
            }
          },
          mention: {
            select: {
              mentionedUserId: true,
              mentionedUser: {
                select: {
                  alias: true
                }
              }
            }
          },
          media: {
            select: { url: true, type: true }
          },
          author: {
            select: {
              name: true,
              alias: true,
              avatarUrl: true
            }
          },
          liked: {
            select: { userId: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      author: {
        select: {
          id: true,
          name: true,
          alias: true,
          avatarUrl: true
        }
      }
    },
    // include: {
    //   author: true,
    //   media: {
    //     select: {
    //       type: true,
    //       url: true
    //     }
    //   },
    //   liked: true,
    //   comments: true
    // },
    orderBy: { createdAt: 'desc' },
    skip,
    take: 10
  })
  return result
}

async function getAllPostsCreatedAt (date: { startDate: Date, endDate: Date }) {
  const { startDate, endDate } = date
  try {
    const result = prisma.post.findMany({
      select: { createdAt: true },
      where: {
        createdAt: {
          lte: endDate,
          gte: startDate
        }
      }
    })

    return result
  } catch (err) {
    console.error(err)
  }
}

interface Post {
  authorId: string
  contents: string
  fileKey?: string
  mediaType?: string
}

class PostData {
  constructor (public post: Post) { }

  setQuery () {
    const query = {
      author: {
        connect: { id: this.post.authorId }
      },
      contents: this.post.contents,
      media: {}
    }

    if (this.post.mediaType) {
      query.media = {
        create: {
          type: this.post.mediaType,
          url: this.post.fileKey
        }
      }
    }

    return query
  }
}

async function getPost (postId: string) {
  try {
    const result = await prisma.post.findFirst({
      where: { id: postId },
      select: postSelector
    })

    return result
  } catch (e) {
    console.error(e)
  }
}

async function createPost (newPost: Post) {
  try {
    const result = await prisma.post.create({
      data: new PostData(newPost).setQuery(),
      select: {
        id: true,
        contents: true,
        createdAt: true,
        liked: true,
        comments: {
          select: {
            id: true,
            contents: true,
            createdAt: true,
            media: {
              select: { url: true, type: true }
            },
            author: {
              select: {
                name: true,
                alias: true,
                avatarUrl: true
              }
            },
            liked: {
              select: { userId: true }
            }
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            alias: true,
            avatarUrl: true
          }
        },
        media: {
          select: { url: true, type: true }
        },
        mention: {
          select: {
            mentionedUserId: true,
            mentionedUser: {
              select: {
                alias: true
              }
            }
          }
        }
      }
    })
    return result
  } catch (err) {
    console.error(err)
  }
}

async function createLikePost (info: { [key: string]: string }) {
  try {
    const result = await prisma.likePost.create({
      data: {
        postId: info.postId,
        userId: info.userId
      },
      include: {
        post: {
          select: { authorId: true }
        }
      }
    })
    await prisma.$disconnect()
    return result
  } catch (e) {
    console.error(e)
    await prisma.$disconnect()
  }
}

async function deleteLikePost (info: {[key: string]: string}) {
  try {
    const result = await prisma.likePost.deleteMany({
      where: {
        postId: info.postId,
        userId: info.userId
      }
    })
    await prisma.$disconnect()
    return result
  } catch (e) {
    console.error(e)
    await prisma.$disconnect()
  }
}

async function deletePost (postId: string) {
  try {
    const result = await prisma.post.delete({
      where: { id: postId }
    })
    await prisma.$disconnect()
    return result
  } catch (err) {
    console.error(err)
    await prisma.$disconnect()
  }
}

export {
  getPost,
  getPosts,
  getUserLikePosts,
  getPostsByKeyword,
  getUserPosts,
  getPostsByMostComments,
  getPostsByMostLiked,
  getAllPostsCreatedAt,
  createPost,
  createLikePost,
  deleteLikePost,
  deletePost
}
