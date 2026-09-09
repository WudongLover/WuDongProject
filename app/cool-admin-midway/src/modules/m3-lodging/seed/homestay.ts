import { M3HomestayEntity } from '../entity/homestay';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Provide } from '@midwayjs/core';

/**
 * m3住宿模块-种子数据
 */
@Provide()
export class M3HomestaySeed {
  @InjectEntityModel(M3HomestayEntity)
  homestayEntity: Repository<M3HomestayEntity>;

  /**
   * 初始化民宿种子数据
   */
  async initSeed() {
    const count = await this.homestayEntity.count();
    if (count > 0) {
      return '民宿数据已存在，跳过初始化';
    }

    const seedData = [
      {
        merchantId: 1,
        name: '苗家风情民宿',
        cover: 'https://picsum.photos/seed/homestay1/800/600',
        images: [
          'https://picsum.photos/seed/homestay1_1/800/600',
          'https://picsum.photos/seed/homestay1_2/800/600',
          'https://picsum.photos/seed/homestay1_3/800/600',
        ],
        rating: 4.8,
        score: { hygiene: 4.9, location: 4.8, service: 4.7 },
        tags: ['苗族风情', '观景阳台', '免费WiFi'],
        facilities: ['空调', '热水器', 'WiFi', '停车场', '观景台'],
        address: '贵州省黔东南苗族侗族自治州西江千户苗寨观景台附近',
        intro: '位于西江千户苗寨观景台附近，推开窗户即可欣赏到壮观的苗寨夜景。民宿保留了苗族传统建筑风格，内部设施现代舒适。',
        notice: '入住时间：14:00后\n退房时间：12:00前\n宠物：不可携带\n吸烟：禁止吸烟',
        status: 'ENABLED',
      },
      {
        merchantId: 1,
        name: '山间小居客栈',
        cover: 'https://picsum.photos/seed/homestay2/800/600',
        images: [
          'https://picsum.photos/seed/homestay2_1/800/600',
          'https://picsum.photos/seed/homestay2_2/800/600',
        ],
        rating: 4.6,
        score: { hygiene: 4.5, location: 4.7, service: 4.6 },
        tags: ['山景房', '安静', '性价比高'],
        facilities: ['空调', '热水器', 'WiFi', '行李寄存'],
        address: '贵州省黔东南苗族侗族自治州雷山县西江镇平寨村',
        intro: '隐藏在苗寨山间的小客栈，环境清幽，是体验苗族乡村生活的绝佳选择。',
        notice: '入住时间：14:00后\n退房时间：12:00前\n宠物：可携带小型犬',
        status: 'ENABLED',
      },
      {
        merchantId: 2,
        name: '梯田观景民宿',
        cover: 'https://picsum.photos/seed/homestay3/800/600',
        images: [
          'https://picsum.photos/seed/homestay3_1/800/600',
        ],
        rating: 4.9,
        score: { hygiene: 5.0, location: 4.8, service: 4.9 },
        tags: ['梯田景观', '日出', '摄影圣地'],
        facilities: ['空调', '热水器', 'WiFi', '观景阳台', '茶室', '停车场'],
        address: '贵州省黔东南苗族侗族自治州从江县加榜乡加车村',
        intro: '位于加榜梯田核心景区，每天清晨可以欣赏到云雾缭绕的梯田美景，是摄影爱好者的天堂。',
        notice: '入住时间：14:00后\n退房时间：12:00前\n宠物：不可携带\n吸烟：仅限阳台区域',
        status: 'ENABLED',
      },
    ];

    for (const item of seedData) {
      await this.homestayEntity.save(item);
    }

    return '民宿种子数据初始化成功';
  }
}
