// scripts/gallery/albums.config.mjs
// 用户手写 - 专辑归属的 single source of truth
// 形式: { id, title, desc, cover, createdAt, photos: [photoId, ...] }
export default [
  {
    id: 'featured-2024',
    title: '2024 精选',
    desc: '每个场景精选代表作品',
    cover: '789f0c3b49f7',
    createdAt: '2024-12',
    photos: [
      '789f0c3b49f7', 'dd61ba1b02cd', '7766a8c1e30f', 'cb42cbaf8cc9', '5860c4b70cd8',
      'a77c7f2b6990', '44305b67b4a5', '0d3c8261a7fe', '77520f131a2d', 'f5dcf424c81d',
    ],
  },
  {
    id: 'city-walk',
    title: '城市漫步',
    desc: '城市街拍与夜景合集',
    cover: 'dd61ba1b02cd',
    createdAt: '2024-12',
    photos: [
      'dd61ba1b02cd', '0d3c8261a7fe', '712aefb9d7ed', 'e803344de163', '2119b7fa2e84',
      '91c9164eb4cf', '643b1a57547c', '6a5505280721', 'e6381623dfeb', 'd4e65967e360',
    ],
  },
  {
    id: 'nature',
    title: '自然之美',
    desc: '风景与野生动物',
    cover: '7766a8c1e30f',
    createdAt: '2024-12',
    photos: [
      '7766a8c1e30f', '5860c4b70cd8', 'd9e34e6c9114', '77520f131a2d', '7ed32d8229d7',
      'bb1636a733ef', '01f30de3ee34', 'f5dcf424c81d', '2f0b73ebb30a', '9b18d1fde6fe',
      '456865648fc7', '3b5b815a55f0', '22ae6e884592', '530d7468a524', 'beed0608d292',
      'b7dd01b80a8d', 'dada83d8bbfa', '062c4b77a648', '65864edaa817', '0399c05e7989',
      '9e025beef0d9', '679b618979be', '603319ee0352', '71cb551c2b9b', '1b516eee4955',
    ],
  },
  {
    id: 'mono',
    title: '黑白世界',
    desc: '黑白摄影作品集',
    cover: 'cb42cbaf8cc9',
    createdAt: '2024-12',
    photos: [
      'cb42cbaf8cc9', '1beacad809bd', '6aac2c0f385f', '01dd94dac42f', '1858f4c9602d',
    ],
  },
  {
    id: 'light-exp',
    title: '光影实验',
    desc: '建筑光影探索',
    cover: '789f0c3b49f7',
    createdAt: '2024-12',
    photos: [
      '789f0c3b49f7', '44305b67b4a5', 'c6e48f1e9a32', 'b960ecbe84b8', 'd8f183558def',
    ],
  },
  {
    id: 'empty-test',
    title: '空专辑',
    desc: '用于测试空状态展示',
    cover: null,
    createdAt: '2024-12',
    photos: [],
  },
]
