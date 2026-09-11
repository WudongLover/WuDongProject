import { storage } from '../cool';
import dev from './dev';
import prod from './prod';

// 是否开发模式
export const isDev = import.meta.env.DEV;

// 配置
export const config = {
	// 项目信息
	app: {
		name: import.meta.env.VITE_NAME,

		// 菜单
		menu: {
			// 是否分组显示
			isGroup: false,
			// 自定义菜单列表
			// 乌东文旅管理端：直接由前端维护左侧菜单，替代后端菜单表里导入的框架示例菜单。
			// 页面 viewPath 指向 src/modules/wudong 下的看板页面；
			// 如需恢复“后端菜单 + RBAC”模式，将本数组置空即可。
			list: [
				{
					name: '总览',
					router: '/',
					viewPath: 'modules/wudong/views/scene/overview.vue',
					type: 1,
					icon: 'icon-monitor',
					orderNum: 0,
					keepAlive: false,
					isShow: true
				},
				{
					name: '衣·非遗',
					type: 0,
					icon: 'icon-goods',
					orderNum: 1,
					isShow: true,
					children: [
						{
							name: '非遗数据看板',
							router: '/wudong/heritage',
							viewPath: 'modules/wudong/views/scene/heritage.vue',
							type: 1,
							icon: 'icon-monitor',
							orderNum: 1,
							keepAlive: true,
							isShow: true
						},
						{
							name: '商品管理',
							router: '/wudong/heritage/manage',
							viewPath: 'modules/wudong/views/heritage/manage.vue',
							type: 1,
							icon: 'icon-list',
							orderNum: 2,
							keepAlive: true,
							isShow: true
						}
					]
				},
				{
					name: '食·风味',
					type: 0,
					icon: 'icon-hot',
					orderNum: 2,
					isShow: true,
					children: [
						{
							name: '风味数据看板',
							router: '/wudong/meal',
							viewPath: 'modules/wudong/views/scene/meal.vue',
							type: 1,
							icon: 'icon-monitor',
							orderNum: 1,
							keepAlive: true,
							isShow: true
						},
						{
							name: '餐厅管理',
							router: '/wudong/meal/manage',
							viewPath: 'modules/wudong/views/meal/manage.vue',
							type: 1,
							icon: 'icon-list',
							orderNum: 2,
							keepAlive: true,
							isShow: true
						}
					]
				},
				{
					name: '住·山居',
					type: 0,
					icon: 'icon-home',
					orderNum: 3,
					isShow: true,
					children: [
						{
							name: '山居数据看板',
							router: '/wudong/lodging',
							viewPath: 'modules/wudong/views/scene/lodging.vue',
							type: 1,
							icon: 'icon-monitor',
							orderNum: 1,
							keepAlive: true,
							isShow: true
						},
						{
							name: '民宿管理',
							router: '/wudong/lodging/manage',
							viewPath: 'modules/wudong/views/lodging/manage.vue',
							type: 1,
							icon: 'icon-list',
							orderNum: 2,
							keepAlive: true,
							isShow: true
						}
					]
				},
				{
					name: '行·山水',
					type: 0,
					icon: 'icon-map',
					orderNum: 4,
					isShow: true,
					children: [
						{
							name: '山水数据看板',
							router: '/wudong/travel',
							viewPath: 'modules/wudong/views/scene/travel.vue',
							type: 1,
							icon: 'icon-monitor',
							orderNum: 1,
							keepAlive: true,
							isShow: true
						},
						{
							name: '景点管理',
							router: '/wudong/travel/manage',
							viewPath: 'modules/wudong/views/travel/manage.vue',
							type: 1,
							icon: 'icon-list',
							orderNum: 2,
							keepAlive: true,
							isShow: true
						}
					]
				},
				{
					name: '社区',
					type: 0,
					icon: 'icon-pic',
					orderNum: 5,
					isShow: true,
					children: [
						{
							name: '社区数据看板',
							router: '/wudong/community',
							viewPath: 'modules/wudong/views/scene/community.vue',
							type: 1,
							icon: 'icon-monitor',
							orderNum: 1,
							keepAlive: true,
							isShow: true
						},
						{
							name: '内容管理',
							router: '/wudong/community/manage',
							viewPath: 'modules/wudong/views/community/manage.vue',
							type: 1,
							icon: 'icon-list',
							orderNum: 2,
							keepAlive: true,
							isShow: true
						}
					]
				},
				{
					name: '用户管理',
					type: 0,
					icon: 'icon-user',
					orderNum: 6,
					isShow: true,
					children: [
						{
							name: '用户数据看板',
							router: '/wudong/user',
							viewPath: 'modules/wudong/views/scene/user.vue',
							type: 1,
							icon: 'icon-monitor',
							orderNum: 1,
							keepAlive: true,
							isShow: true
						},
						{
							name: '用户列表',
							router: '/user/list',
							viewPath: 'modules/user/views/list.vue',
							type: 1,
							icon: 'icon-list',
							orderNum: 2,
							keepAlive: true,
							isShow: true
						}
					]
				},
				{
					name: '内容运营',
					type: 0,
					icon: 'icon-news',
					orderNum: 7,
					isShow: true,
					children: [
						{
							name: '文化推文',
							router: '/wudong/content/story',
							viewPath: 'modules/wudong/views/content/story.vue',
							type: 1,
							icon: 'icon-doc',
							orderNum: 1,
							keepAlive: true,
							isShow: true
						}
					]
				}
			]
		},

		// 路由
		router: {
			// 模式
			mode: import.meta.env.MODE == 'static' ? 'hash' : 'history',
			// 转场动画
			transition: 'slide'
		}
	},

	// 国际化配置
	i18n: {
		locale: storage.get('locale') || 'zh-cn',
		languages: [
			{
				label: '中文',
				value: 'zh-cn'
			},
			{
				label: '繁体中文',
				value: 'zh-tw'
			},
			{
				label: 'English',
				value: 'en'
			}
		]
	},

	// 忽略规则
	ignore: {
		// 不显示请求进度条
		NProgress: ['__cool_*'],
		// 页面不需要登录验证
		token: []
	},

	// 当前环境
	...(isDev ? dev : prod)
};

export * from './proxy';
