import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import * as moment from 'moment';

/**
 * 看板统计服务
 * 业务数据统一位于 wudong 库（与 cool 管理库同实例），接口通过全限定表名直读。
 * 当前返回结构兼容前端 wudong 看板组件（stats/trend/ratio/lists）。
 */
@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class DashboardStatsService {
  @Inject()
  typeORMDataSourceManager: TypeORMDataSourceManager;

  private get db() {
    return this.typeORMDataSourceManager.getDataSource('default');
  }

  private async query(sql: string, params?: any[]) {
    return this.db.query(sql, params || []);
  }

  private toNumber(v: any): number {
    return Number(v == null ? 0 : v);
  }

  /** 按日期补零，生成近 n 天数组 */
  private fillDays(
    days: number,
    rows: { d: string | Date; v: number }[],
    valueKey = 'v'
  ): number[] {
    const map: { [key: string]: number } = {};
    rows.forEach(e => {
      const key = moment(e.d).format('YYYY-MM-DD');
      map[key] = Number(e[valueKey] || 0);
    });

    const result: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = moment().subtract(i, 'day').format('YYYY-MM-DD');
      result.push(map[key] || 0);
    }
    return result;
  }

  /** 近 n 天日期 */
  private dayLabels(days: number, format = 'MM-DD'): string[] {
    const arr: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      arr.push(moment().subtract(i, 'day').format(format));
    }
    return arr;
  }

  /**
   * 平台总览
   */
  async overview() {
    const [today, totalOrder, product, restaurant, homestay, route, post, user, merchant, lowStock] =
      await Promise.all([
        this.query(
          `SELECT IFNULL(SUM(amount),0) amount, COUNT(*) c
             FROM wudong.wudong_common_order
            WHERE deleted_at IS NULL
              AND status NOT IN ('UNPAID','CANCELLED')
              AND DATE(created_at) = CURDATE()`
        ),
        this.query(
          `SELECT COUNT(*) c, IFNULL(SUM(amount),0) amount
             FROM wudong.wudong_common_order
            WHERE deleted_at IS NULL AND status NOT IN ('UNPAID','CANCELLED')`
        ),
        this.query(
          `SELECT COUNT(*) c FROM wudong.wudong_m1_product WHERE deleted_at IS NULL AND status = 'ON_SHELF'`
        ),
        this.query(
          `SELECT COUNT(*) c FROM wudong.wudong_m2_restaurant WHERE deleted_at IS NULL AND status = 'ENABLED'`
        ),
        this.query(
          `SELECT COUNT(*) c FROM wudong.wudong_m3_homestay WHERE deleted_at IS NULL AND status = 'ENABLED'`
        ),
        this.query(
          `SELECT COUNT(*) c FROM wudong.wudong_m4_route WHERE deleted_at IS NULL`
        ),
        this.query(
          `SELECT COUNT(*) c FROM wudong.wudong_m5_post WHERE deleted_at IS NULL`
        ),
        this.query(
          `SELECT COUNT(*) c FROM wudong.wudong_common_user WHERE deleted_at IS NULL`
        ),
        this.query(
          `SELECT COUNT(*) c FROM wudong.wudong_common_merchant WHERE deleted_at IS NULL AND status = 'ENABLED'`
        ),
        this.query(
          `SELECT COUNT(*) c FROM wudong.wudong_m1_product
            WHERE deleted_at IS NULL AND status = 'ON_SHELF' AND stock < 10`
        ),
      ]);

    const todayUser = await this.query(
      `SELECT COUNT(*) c FROM wudong.wudong_common_user
        WHERE deleted_at IS NULL AND DATE(created_at) = CURDATE()`
    );

    const activeUser = await this.query(
      `SELECT COUNT(*) c FROM (
          SELECT user_id FROM wudong.wudong_common_order
           WHERE deleted_at IS NULL AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          UNION
          SELECT user_id FROM wudong.wudong_m5_post
           WHERE deleted_at IS NULL AND published_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) t`
    );

    const orderDays = await this.query(
      `SELECT DATE(created_at) d, COUNT(*) c, IFNULL(SUM(amount),0) v
         FROM wudong.wudong_common_order
        WHERE deleted_at IS NULL AND status NOT IN ('UNPAID','CANCELLED')
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY DATE(created_at)`
    );

    const moduleAmount = await this.query(
      `SELECT type, IFNULL(SUM(amount),0) v
         FROM wudong.wudong_common_order
        WHERE deleted_at IS NULL
          AND status NOT IN ('UNPAID','CANCELLED')
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY type`
    );

    const pendingPost = await this.query(
      `SELECT COUNT(*) c FROM wudong.wudong_m5_post
        WHERE deleted_at IS NULL AND status <> 'PASSED'`
    );
    const refundCount = await this.query(
      `SELECT COUNT(*) c FROM wudong.wudong_common_order
        WHERE deleted_at IS NULL AND status IN ('REFUNDED','REFUNDING','REFUND_REQUESTED')`
    );

    const ratioMap: { [key: string]: number } = {
      GOODS: 0,
      MEAL: 0,
      LODGING: 0,
      TICKET: 0,
      ROUTE: 0,
    };
    moduleAmount.forEach((e: any) => {
      ratioMap[e.type] = (ratioMap[e.type] || 0) + this.toNumber(e.v);
    });

    const stats = [
      {
        label: '累计有效订单金额',
        value: this.toNumber(totalOrder[0]?.amount),
        unit: '元',
        money: true,
        icon: 'icon-amount',
        color: '#4165d7',
        trend: '数据库实时',
        desc: `今日 ${this.toNumber(today[0]?.amount)} 元`,
      },
      {
        label: '累计有效订单',
        value: this.toNumber(totalOrder[0]?.c),
        icon: 'icon-cart',
        color: '#e6a23c',
        trend: '数据库实时',
        desc: `今日 ${this.toNumber(today[0]?.c)} 单`,
      },
      {
        label: '注册用户',
        value: this.toNumber(user[0]?.c),
        icon: 'icon-user',
        color: '#67c23a',
        trend: '数据库实时',
        desc: `今日新增 ${this.toNumber(todayUser[0]?.c)}`,
      },
      {
        label: '近 7 日活跃游客',
        value: this.toNumber(activeUser[0]?.c),
        icon: 'icon-activity',
        color: '#9b59b6',
        trend: '数据库实时',
        desc: `商品 ${product[0]?.c} · 餐厅 ${restaurant[0]?.c} · 民宿 ${homestay[0]?.c}`,
      },
    ];

    return {
      updatedAt: moment().format('YYYY-MM-DD HH:mm'),
      stats,
      trend: {
        categories: this.dayLabels(30),
        series: [
          {
            name: '交易金额(元)',
            data: this.fillDays(
              30,
              orderDays.map(e => ({ d: e.d, v: e.v })),
              'v'
            ),
            type: 'line',
            area: true,
          },
          {
            name: '有效订单(单)',
            data: this.fillDays(
              30,
              orderDays.map(e => ({ d: e.d, v: e.c })),
              'c'
            ),
            type: 'line',
            yAxisIndex: 1,
            color: '#e6a23c',
          },
        ],
      },
      ratio: {
        unit: '元',
        rows: [
          { name: '衣·非遗', value: ratioMap['GOODS'] },
          { name: '食·风味', value: ratioMap['MEAL'] },
          { name: '住·山居', value: ratioMap['LODGING'] },
          { name: '行·山水', value: ratioMap['TICKET'] + ratioMap['ROUTE'] },
        ],
      },
      lists: [
        {
          title: '平台待办监控',
          rows: [
            {
              name: '社区内容待审核',
              desc: '状态非 PASSED 的内容',
              value: this.toNumber(pendingPost[0]?.c),
              unit: '条',
              status: { label: '待处理', type: 'danger' },
            },
            {
              name: '退款/售后订单',
              desc: '需要运营跟进处理',
              value: this.toNumber(refundCount[0]?.c),
              unit: '单',
              status: { label: '待处理', type: 'warning' },
            },
            {
              name: '非遗商品库存预警',
              desc: '库存低于 10 件的上架商品',
              value: this.toNumber(lowStock[0]?.c),
              unit: '款',
              status: { label: '预警', type: 'danger' },
            },
            {
              name: '合作商家',
              desc: '启用状态商家',
              value: this.toNumber(merchant[0]?.c),
              unit: '家',
              status: { label: '正常', type: 'success' },
            },
          ],
        },
        {
          title: '内容资产规模',
          rows: [
            {
              name: '社区游记/动态',
              desc: '游客 UGC 内容',
              value: this.toNumber(post[0]?.c),
              unit: '篇',
              status: { label: '累计', type: 'primary' },
            },
            {
              name: '非遗商品',
              desc: '上架中',
              value: this.toNumber(product[0]?.c),
              unit: '款',
              status: { label: '正常', type: 'success' },
            },
            {
              name: '餐厅 / 民宿 / 路线',
              desc: '食住行业态规模',
              value:
                this.toNumber(restaurant[0]?.c) +
                this.toNumber(homestay[0]?.c) +
                this.toNumber(route[0]?.c),
              unit: '家',
              status: { label: '正常', type: 'success' },
            },
          ],
        },
      ],
    };
  }

  /**
   * 衣·非遗
   */
  async heritage() {
    const product = await this.query(
      `SELECT COUNT(*) c, SUM(stock) stock,
              SUM(CASE WHEN stock < 10 THEN 1 ELSE 0 END) low
         FROM wudong.wudong_m1_product
        WHERE deleted_at IS NULL AND status = 'ON_SHELF' AND module = 'GOODS'`
    );
    const monthOrder = await this.query(
      `SELECT COUNT(*) c, IFNULL(SUM(amount),0) amount
         FROM wudong.wudong_common_order
        WHERE deleted_at IS NULL AND type = 'GOODS'
          AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`
    );
    const todayOrder = await this.query(
      `SELECT COUNT(*) c FROM wudong.wudong_common_order
        WHERE deleted_at IS NULL AND type = 'GOODS' AND DATE(created_at) = CURDATE()`
    );
    const days = await this.query(
      `SELECT DATE(created_at) d, COUNT(*) c, IFNULL(SUM(amount),0) v
         FROM wudong.wudong_common_order
        WHERE deleted_at IS NULL AND type = 'GOODS'
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY DATE(created_at)`
    );
    const categories = await this.query(
      `SELECT c.name name, IFNULL(SUM(p.sales),0) v
         FROM wudong.wudong_m1_product p
         JOIN wudong.wudong_m1_category c ON c.id = p.category_id AND c.module = 'GOODS'
        WHERE p.deleted_at IS NULL AND p.status = 'ON_SHELF'
        GROUP BY c.id, c.name
        ORDER BY v DESC`
    );
    const hot = await this.query(
      `SELECT title, sales, stock, subtitle
         FROM wudong.wudong_m1_product
        WHERE deleted_at IS NULL AND status = 'ON_SHELF' AND module = 'GOODS'
        ORDER BY sales DESC
        LIMIT 5`
    );
    const warnProducts = await this.query(
      `SELECT title, subtitle, stock
         FROM wudong.wudong_m1_product
        WHERE deleted_at IS NULL AND status = 'ON_SHELF' AND module = 'GOODS'
          AND stock < 10
        ORDER BY stock ASC
        LIMIT 5`
    );

    const stats = [
      {
        label: '在售非遗商品',
        value: this.toNumber(product[0]?.c),
        unit: '款',
        icon: 'icon-goods',
        color: '#4165d7',
        desc: `当前总库存 ${this.toNumber(product[0]?.stock)} 件`,
      },
      {
        label: '本月非遗销售额',
        value: this.toNumber(monthOrder[0]?.amount),
        unit: '元',
        money: true,
        icon: 'icon-amount',
        color: '#e6a23c',
        desc: '按已支付/有效订单统计',
      },
      {
        label: '非遗订单量',
        value: this.toNumber(monthOrder[0]?.c),
        unit: '单',
        icon: 'icon-cart',
        color: '#67c23a',
        desc: `今日 ${this.toNumber(todayOrder[0]?.c)} 单`,
      },
      {
        label: '库存预警',
        value: this.toNumber(product[0]?.low),
        unit: '款',
        icon: 'icon-warn',
        color: '#f56c6c',
        desc: '库存低于 10 件',
      },
    ];

    return {
      updatedAt: moment().format('YYYY-MM-DD HH:mm'),
      stats,
      trend: {
        categories: this.dayLabels(30),
        series: [
          {
            name: '销售额(元)',
            data: this.fillDays(30, days.map(e => ({ d: e.d, v: e.v }))),
            type: 'line',
            area: true,
          },
          {
            name: '订单量(单)',
            data: this.fillDays(30, days.map(e => ({ d: e.d, v: e.c })), 'c'),
            type: 'line',
            yAxisIndex: 1,
            color: '#e6a23c',
          },
        ],
      },
      ratio: {
        unit: '件',
        rows: categories.map((e: any) => ({ name: e.name, value: this.toNumber(e.v) })),
      },
      lists: [
        {
          title: '非遗商品热销榜',
          extra: '按累计销量排序',
          rows: hot.map((e: any, i: number) => ({
            name: e.title,
            desc: e.subtitle,
            value: this.toNumber(e.sales),
            unit: '件',
            ...(i === 0 ? { trend: 'TOP 1', trendType: 'up' as const } : {}),
          })),
        },
        {
          title: '库存与履约预警',
          rows:
            warnProducts.length > 0
              ? warnProducts.map((e: any) => ({
                  name: e.title,
                  desc: e.subtitle,
                  value: this.toNumber(e.stock),
                  unit: '件',
                  status: { label: '库存紧张', type: 'danger' },
                }))
              : [
                  {
                    name: '暂无低库存商品',
                    desc: '当前非遗商品库存正常',
                    value: 0,
                    unit: '款',
                    status: { label: '正常', type: 'success' },
                  },
                ],
        },
      ],
    };
  }

  /**
   * 食·风味
   */
  async meal() {
    const restaurant = await this.query(
      `SELECT COUNT(*) c FROM wudong.wudong_m2_restaurant
        WHERE deleted_at IS NULL AND status = 'ENABLED'`
    );
    const dish = await this.query(
      `SELECT COUNT(*) c FROM wudong.wudong_m2_dish WHERE deleted_at IS NULL`
    );
    const month = await this.query(
      `SELECT COUNT(*) c, IFNULL(SUM(amount),0) amount
         FROM wudong.wudong_common_order
        WHERE deleted_at IS NULL AND type = 'MEAL'
          AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`
    );
    const pending = await this.query(
      `SELECT COUNT(*) c FROM wudong.wudong_common_order
        WHERE deleted_at IS NULL AND type = 'MEAL' AND status IN ('UNPAID','CONFIRMED')`
    );
    const days = await this.query(
      `SELECT DATE(created_at) d, COUNT(*) c, IFNULL(SUM(amount),0) v
         FROM wudong.wudong_common_order
        WHERE deleted_at IS NULL AND type = 'MEAL'
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
        GROUP BY DATE(created_at)`
    );
    const hot = await this.query(
      `SELECT r.name name, r.rating rating, COUNT(e.id) c
         FROM wudong.wudong_m2_restaurant r
         LEFT JOIN wudong.wudong_m2_order_ext e ON e.restaurant_id = r.id
        WHERE r.deleted_at IS NULL
        GROUP BY r.id, r.name, r.rating
        ORDER BY c DESC, r.rating DESC`
    );
    const slotRows = await this.query(
      `SELECT s.name name, COUNT(e.id) v
         FROM wudong.wudong_m2_time_slot s
         LEFT JOIN wudong.wudong_m2_order_ext e ON e.slot_id = s.id
        GROUP BY s.id, s.name
        ORDER BY v DESC`
    );

    return {
      updatedAt: moment().format('YYYY-MM-DD HH:mm'),
      stats: [
        {
          label: '合作餐厅',
          value: this.toNumber(restaurant[0]?.c),
          unit: '家',
          icon: 'icon-hot',
          color: '#e6a23c',
          desc: `上架菜品 ${this.toNumber(dish[0]?.c)} 道`,
        },
        {
          label: '本月餐饮订单',
          value: this.toNumber(month[0]?.c),
          unit: '单',
          icon: 'icon-tag',
          color: '#4165d7',
          desc: '餐厅/餐位预订订单',
        },
        {
          label: '本月餐饮销售额',
          value: this.toNumber(month[0]?.amount),
          unit: '元',
          money: true,
          icon: 'icon-amount',
          color: '#67c23a',
          desc: '按有效订单统计',
        },
        {
          label: '待确认/待支付',
          value: this.toNumber(pending[0]?.c),
          unit: '单',
          icon: 'icon-warn',
          color: '#f56c6c',
          desc: '需餐厅或运营跟进',
        },
      ],
      trend: {
        categories: this.dayLabels(14),
        series: [
          {
            name: '餐饮订单(单)',
            data: this.fillDays(14, days.map(e => ({ d: e.d, v: e.c })), 'c'),
            type: 'line',
            area: true,
          },
          {
            name: '餐饮销售额(元)',
            data: this.fillDays(14, days.map(e => ({ d: e.d, v: e.v }))),
            type: 'line',
            yAxisIndex: 1,
            color: '#67c23a',
          },
        ],
      },
      ratio: {
        unit: '单',
        rows: slotRows.map((e: any) => ({ name: e.name, value: this.toNumber(e.v) })),
      },
      lists: [
        {
          title: '餐厅热度排行',
          extra: '按餐饮订单数排序',
          rows: hot.map((e: any, i: number) => ({
            name: e.name,
            desc: `评分 ${Number(e.rating || 0).toFixed(1)}`,
            value: this.toNumber(e.c),
            unit: '单',
            ...(i === 0 ? { trend: 'TOP 1', trendType: 'up' as const } : {}),
          })),
        },
        {
          title: '餐位时段分布',
          rows: slotRows.slice(0, 5).map((e: any) => ({
            name: e.name,
            value: this.toNumber(e.v),
            unit: '单',
          })),
        },
      ],
    };
  }

  /**
   * 住·山居
   */
  async lodging() {
    const homestay = await this.query(
      `SELECT COUNT(*) c FROM wudong.wudong_m3_homestay
        WHERE deleted_at IS NULL AND status = 'ENABLED'`
    );
    const room = await this.query(
      `SELECT COUNT(*) c, SUM(stock) stock FROM wudong.wudong_m3_room_type WHERE deleted_at IS NULL`
    );
    const month = await this.query(
      `SELECT COUNT(*) c, IFNULL(SUM(amount),0) amount
         FROM wudong.wudong_common_order
        WHERE deleted_at IS NULL AND type = 'LODGING'
          AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`
    );
    const todayIn = await this.query(
      `SELECT COUNT(*) c FROM wudong.wudong_m3_order_ext e
        JOIN wudong.wudong_common_order o ON o.id = e.order_id AND o.deleted_at IS NULL
       WHERE e.check_in_date = CURDATE()`
    );
    const days = await this.query(
      `SELECT e.check_in_date d, COUNT(*) c, IFNULL(SUM(o.amount),0) v
         FROM wudong.wudong_m3_order_ext e
         JOIN wudong.wudong_common_order o ON o.id = e.order_id AND o.deleted_at IS NULL
        WHERE e.check_in_date >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
        GROUP BY e.check_in_date`
    );
    const priceRows = await this.query(
      `SELECT CASE
                WHEN price < 400 THEN '经济带'
                WHEN price <= 700 THEN '舒适带'
                ELSE '高端带'
              END name, COUNT(*) v
         FROM wudong.wudong_m3_room_type
        WHERE deleted_at IS NULL
        GROUP BY name`
    );
    const hot = await this.query(
      `SELECT h.name name, h.rating rating, COUNT(e.id) c
         FROM wudong.wudong_m3_homestay h
         LEFT JOIN wudong.wudong_m3_order_ext e ON e.homestay_id = h.id
        WHERE h.deleted_at IS NULL
        GROUP BY h.id, h.name, h.rating
        ORDER BY c DESC, h.rating DESC`
    );

    return {
      updatedAt: moment().format('YYYY-MM-DD HH:mm'),
      stats: [
        {
          label: '在营民宿',
          value: this.toNumber(homestay[0]?.c),
          unit: '家',
          icon: 'icon-home',
          color: '#4165d7',
          desc: '苗寨特色民宿/客栈',
        },
        {
          label: '在租房型',
          value: this.toNumber(room[0]?.c),
          unit: '种',
          icon: 'icon-design',
          color: '#e6a23c',
          desc: `房间总量 ${this.toNumber(room[0]?.stock)} 间`,
        },
        {
          label: '本月住宿订单',
          value: this.toNumber(month[0]?.c),
          unit: '单',
          icon: 'icon-cart',
          color: '#67c23a',
          desc: `本月销售额 ${this.toNumber(month[0]?.amount)} 元`,
        },
        {
          label: '今日办理入住',
          value: this.toNumber(todayIn[0]?.c),
          unit: '间',
          icon: 'icon-local',
          color: '#9b59b6',
          desc: '按订单扩展入住日期统计',
        },
      ],
      trend: {
        categories: this.dayLabels(14),
        series: [
          {
            name: '入住间夜(间)',
            data: this.fillDays(14, days.map(e => ({ d: e.d, v: e.c })), 'c'),
            type: 'bar',
            color: '#4165d7',
          },
          {
            name: '住宿金额(元)',
            data: this.fillDays(14, days.map(e => ({ d: e.d, v: e.v }))),
            type: 'line',
            yAxisIndex: 1,
            color: '#e6a23c',
          },
        ],
      },
      ratio: {
        unit: '种',
        rows: priceRows.map((e: any) => ({ name: e.name, value: this.toNumber(e.v) })),
      },
      lists: [
        {
          title: '民宿热度排行',
          extra: '按住宿订单数排序',
          rows: hot.map((e: any, i: number) => ({
            name: e.name,
            desc: `评分 ${Number(e.rating || 0).toFixed(1)}`,
            value: this.toNumber(e.c),
            unit: '单',
            ...(i === 0 ? { trend: 'TOP 1', trendType: 'up' as const } : {}),
          })),
        },
        {
          title: '入住订单动态',
          rows: days.slice(-5).reverse().map((e: any) => ({
            name: moment(e.d).format('MM-DD 入住'),
            value: this.toNumber(e.c),
            unit: '间',
          })),
        },
      ],
    };
  }

  /**
   * 行·山水
   */
  async travel() {
    const scenic = await this.query(
      `SELECT COUNT(*) c FROM wudong.wudong_m4_scenic
        WHERE deleted_at IS NULL AND status = 'ENABLED'`
    );
    const ticket = await this.query(
      `SELECT COUNT(*) c, SUM(stock) stock,
              SUM(CASE WHEN stock < 50 THEN 1 ELSE 0 END) low
         FROM wudong.wudong_m4_ticket WHERE deleted_at IS NULL`
    );
    const route = await this.query(
      `SELECT COUNT(*) c FROM wudong.wudong_m4_route WHERE deleted_at IS NULL`
    );
    const month = await this.query(
      `SELECT COUNT(*) c, IFNULL(SUM(amount),0) amount
         FROM wudong.wudong_common_order
        WHERE deleted_at IS NULL AND type IN ('TICKET','ROUTE')
          AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`
    );
    const days = await this.query(
      `SELECT DATE(created_at) d, COUNT(*) c, type
         FROM wudong.wudong_common_order
        WHERE deleted_at IS NULL AND type IN ('TICKET','ROUTE')
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY DATE(created_at), type`
    );
    const ratio = await this.query(
      `SELECT type, IFNULL(SUM(amount),0) v
         FROM wudong.wudong_common_order
        WHERE deleted_at IS NULL AND type IN ('TICKET','ROUTE')
        GROUP BY type`
    );
    const hot = await this.query(
      `SELECT name, stock FROM wudong.wudong_m4_ticket
        WHERE deleted_at IS NULL ORDER BY stock DESC LIMIT 4`
    );
    const hotRoute = await this.query(
      `SELECT title, price FROM wudong.wudong_m4_route
        WHERE deleted_at IS NULL ORDER BY price ASC LIMIT 4`
    );

    const series = (type: string) =>
      this.fillDays(
        30,
        days.filter((e: any) => e.type === type).map((e: any) => ({ d: e.d, v: e.c })),
        'c'
      );

    const ratioMap: { [key: string]: number } = {};
    ratio.forEach((e: any) => (ratioMap[e.type] = this.toNumber(e.v)));

    return {
      updatedAt: moment().format('YYYY-MM-DD HH:mm'),
      stats: [
        {
          label: '合作景区',
          value: this.toNumber(scenic[0]?.c),
          unit: '个',
          icon: 'icon-map',
          color: '#4165d7',
          desc: '乌东 / 雷公山等',
        },
        {
          label: '票种与路线',
          value: this.toNumber(ticket[0]?.c) + this.toNumber(route[0]?.c),
          unit: '种',
          icon: 'icon-vip',
          color: '#e6a23c',
          desc: `票种 ${this.toNumber(ticket[0]?.c)} · 路线 ${this.toNumber(route[0]?.c)}`,
        },
        {
          label: '本月票务订单',
          value: this.toNumber(month[0]?.c),
          unit: '单',
          icon: 'icon-rank',
          color: '#67c23a',
          desc: `销售额 ${this.toNumber(month[0]?.amount)} 元`,
        },
        {
          label: '库存预警票种',
          value: this.toNumber(ticket[0]?.low),
          unit: '种',
          icon: 'icon-warn',
          color: '#f56c6c',
          desc: '库存低于 50 张',
        },
      ],
      trend: {
        categories: this.dayLabels(30),
        series: [
          {
            name: '门票订单(单)',
            data: series('TICKET'),
            type: 'line',
            area: true,
          },
          {
            name: '路线订单(单)',
            data: series('ROUTE'),
            type: 'line',
            yAxisIndex: 1,
            color: '#67c23a',
          },
        ],
      },
      ratio: {
        unit: '元',
        rows: [
          { name: '景区门票', value: ratioMap['TICKET'] || 0 },
          { name: '路线套餐', value: ratioMap['ROUTE'] || 0 },
        ],
      },
      lists: [
        {
          title: '门票库存 TOP',
          extra: '按当前库存排序',
          rows: hot.map((e: any, i: number) => ({
            name: e.name,
            value: this.toNumber(e.stock),
            unit: '张',
            ...(i === 0 ? { trend: '库存充足', trendType: 'up' as const } : {}),
          })),
        },
        {
          title: '路线套餐',
          rows: hotRoute.map((e: any) => ({
            name: e.title,
            value: this.toNumber(e.price),
            unit: '元',
          })),
        },
      ],
    };
  }

  /**
   * 社区
   */
  async community() {
    const post = await this.query(
      `SELECT COUNT(*) c,
              SUM(CASE WHEN DATE(published_at) = CURDATE() THEN 1 ELSE 0 END) today,
              SUM(CASE WHEN status <> 'PASSED' THEN 1 ELSE 0 END) pending
         FROM wudong.wudong_m5_post WHERE deleted_at IS NULL`
    );
    const comment = await this.query(
      `SELECT COUNT(*) c FROM wudong.wudong_m5_comment WHERE deleted_at IS NULL`
    );
    const days = await this.query(
      `SELECT DATE(COALESCE(published_at, created_at)) d, COUNT(*) c
         FROM wudong.wudong_m5_post
        WHERE deleted_at IS NULL AND published_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY DATE(COALESCE(published_at, created_at))`
    );
    const topic = await this.query(
      `SELECT topic, COUNT(*) c, SUM(views) views, SUM(likes) likes
         FROM wudong.wudong_m5_post
        WHERE deleted_at IS NULL
        GROUP BY topic
        ORDER BY likes DESC
        LIMIT 6`
    );
    const latest = await this.query(
      `SELECT title, topic, published_at, created_at
         FROM wudong.wudong_m5_post
        WHERE deleted_at IS NULL
        ORDER BY COALESCE(published_at, created_at) DESC
        LIMIT 5`
    );

    return {
      updatedAt: moment().format('YYYY-MM-DD HH:mm'),
      stats: [
        {
          label: '累计游记/动态',
          value: this.toNumber(post[0]?.c),
          unit: '篇',
          icon: 'icon-pic',
          color: '#4165d7',
          desc: `评论 ${this.toNumber(comment[0]?.c)} 条`,
        },
        {
          label: '今日新增内容',
          value: this.toNumber(post[0]?.today),
          unit: '条',
          icon: 'icon-camera',
          color: '#67c23a',
          desc: '按发布日期统计',
        },
        {
          label: '内容待审核',
          value: this.toNumber(post[0]?.pending),
          unit: '条',
          icon: 'icon-search',
          color: '#e6a23c',
          desc: '状态非 PASSED',
        },
        {
          label: '热门话题',
          value: topic.length,
          unit: '个',
          icon: 'icon-activity',
          color: '#9b59b6',
          desc: '按点赞量排序',
        },
      ],
      trend: {
        categories: this.dayLabels(30),
        series: [
          {
            name: '发布量(条)',
            data: this.fillDays(30, days.map(e => ({ d: e.d, v: e.c })), 'c'),
            type: 'line',
            area: true,
          },
        ],
      },
      ratio: {
        unit: '话题',
        rows: topic.map((e: any) => ({ name: e.topic || '未分类', value: this.toNumber(e.c) })),
      },
      lists: [
        {
          title: '热门话题 TOP',
          extra: '按点赞量排序',
          rows: topic.map((e: any, i: number) => ({
            name: e.topic || '未分类',
            desc: `浏览 ${this.toNumber(e.views)} · 点赞 ${this.toNumber(e.likes)}`,
            value: this.toNumber(e.c),
            unit: '篇',
            ...(i === 0 ? { trend: '最热', trendType: 'up' as const } : {}),
          })),
        },
        {
          title: '最新社区内容',
          rows: latest.map((e: any) => ({
            name: e.title,
            desc: `${e.topic || '未分类'} · ${moment(e.published_at || e.created_at).format(
              'MM-DD'
            )}`,
            value: '已发布',
            status: { label: 'PASSED', type: 'success' },
          })),
        },
      ],
    };
  }

  /**
   * 用户
   */
  async user() {
    const userRows = await this.query(
      `SELECT COUNT(*) c,
              SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) today
         FROM wudong.wudong_common_user WHERE deleted_at IS NULL`
    );
    const active = await this.query(
      `SELECT COUNT(*) c FROM (
          SELECT user_id FROM wudong.wudong_common_order
           WHERE deleted_at IS NULL AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          UNION
          SELECT user_id FROM wudong.wudong_m5_post
           WHERE deleted_at IS NULL AND published_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) t`
    );
    const days = await this.query(
      `SELECT DATE(created_at) d, COUNT(*) c
         FROM wudong.wudong_common_user
        WHERE deleted_at IS NULL AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY DATE(created_at)`
    );
    const latest = await this.query(
      `SELECT id, name, phone, created_at
         FROM wudong.wudong_common_user
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 6`
    );
    const status = await this.query(
      `SELECT status, COUNT(*) c FROM wudong.wudong_common_user
        WHERE deleted_at IS NULL GROUP BY status`
    );

    const disabled =
      status.find((e: any) => e.status === 'DISABLED' || e.status === 'BANNED')?.c || 0;

    return {
      updatedAt: moment().format('YYYY-MM-DD HH:mm'),
      stats: [
        {
          label: '注册用户',
          value: this.toNumber(userRows[0]?.c),
          unit: '人',
          icon: 'icon-user',
          color: '#4165d7',
          desc: 'C 端游客账号',
        },
        {
          label: '今日新增用户',
          value: this.toNumber(userRows[0]?.today),
          unit: '人',
          icon: 'icon-activity',
          color: '#67c23a',
          desc: '数据库实时统计',
        },
        {
          label: '近 7 日活跃用户',
          value: this.toNumber(active[0]?.c),
          unit: '人',
          icon: 'icon-local',
          color: '#e6a23c',
          desc: '近 7 日有订单或内容行为',
        },
        {
          label: '禁用/异常账号',
          value: this.toNumber(disabled),
          unit: '个',
          icon: 'icon-warn',
          color: '#f56c6c',
          desc: '状态为 DISABLED/BANNED',
        },
      ],
      trend: {
        categories: this.dayLabels(30),
        series: [
          {
            name: '新增用户(人)',
            data: this.fillDays(30, days.map(e => ({ d: e.d, v: e.c })), 'c'),
            type: 'line',
            area: true,
          },
        ],
      },
      ratio: {
        unit: '人',
        rows: [
          { name: '正常用户', value: this.toNumber(userRows[0]?.c) - this.toNumber(disabled) },
          { name: '禁用/异常', value: this.toNumber(disabled) },
        ],
      },
      lists: [
        {
          title: '最新注册用户',
          rows: latest.map((e: any) => ({
            name: e.name,
            desc: `${e.phone || '手机号未开放'} · 注册于 ${moment(e.created_at).format('MM-DD HH:mm')}`,
            value: '正常',
            status: { label: 'ENABLED', type: 'success' },
          })),
        },
        {
          title: '用户状态分布',
          rows: status.map((e: any) => ({
            name: e.status || '未知',
            value: this.toNumber(e.c),
            unit: '人',
          })),
        },
      ],
    };
  }
}
