<template>
	<cl-crud ref="Crud">
		<cl-row class="user-toolbar">
			<cl-refresh-btn /><cl-add-btn /><cl-multi-delete-btn /><cl-flex1 /><cl-search ref="Search" />
		</cl-row>
		<cl-row><cl-table ref="Table" /></cl-row>
		<cl-row><cl-flex1 /><cl-pagination /></cl-row>
		<cl-upsert ref="Upsert" />
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({ name: 'user-list' });

import { reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Delete, View, Top, Bottom } from '@element-plus/icons-vue';
import { useCrud, useSearch, useTable, useUpsert } from '@cool-vue/crud';
import { useCool } from '/@/cool';

const { service } = useCool();
type UserStatus = 0 | 1 | 2;
type Gender = 0 | 1 | 2;
type LoginType = 0 | 1 | 2;
interface UserItem {
	id: number; unionid: string; avatarUrl: string; nickName: string; phone: string;
	gender: Gender; status: UserStatus; loginType: LoginType; description: string; createTime: string;
}

const options = {
	loginType: [{ label: '小程序', value: 0, type: 'danger' }, { label: '公众号', value: 1, type: 'success' }, { label: 'H5', value: 2, type: 'info' }],
	gender: [{ label: '未知', value: 0, type: 'info' }, { label: '男', value: 1, type: 'success' }, { label: '女', value: 2, type: 'danger' }],
	status: [{ label: '禁用', value: 0, type: 'danger' }, { label: '正常', value: 1, type: 'success' }, { label: '已注销', value: 2, type: 'warning' }]
};
const statusFilterOptions = [{ label: '全部状态', value: '' }, ...options.status];
const genderFilterOptions = [{ label: '全部性别', value: '' }, ...options.gender];
const loginTypeFilterOptions = [{ label: '全部方式', value: '' }, ...options.loginType];
const avatarPool = [
	'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/109_sea-of-clouds-mountain-sunrise_c1b39d04.jpg',
	'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/112_silversmith-crafting-silver-workshop_748d05e3.jpg',
	'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/121_traditional-chinese-village-street_e5458950.jpg'
];

function createMockUsers(): UserItem[] {
	const names = ['苗岭小哥', '旅行的猫', '山居日记', '摄影师阿杰', '美食猎人', '亲子游天下', '云上住客', '乌东拾光'];
	const phones = ['138****1024', '139****2861', '186****5412', '177****9038'];
	return Array.from({ length: 28 }, (_, index) => {
		const i = index + 1;
		return {
			id: 2000 + i, unionid: `wudong-user-${String(i).padStart(3, '0')}`, avatarUrl: avatarPool[i % avatarPool.length],
			nickName: `${names[i % names.length]}${i > 8 ? ` · ${String(i).padStart(2, '0')}` : ''}`, phone: phones[i % phones.length],
			gender: (i % 3) as Gender, status: (i % 11 === 0 ? 0 : i % 17 === 0 ? 2 : 1) as UserStatus,
			loginType: (i % 3) as LoginType, description: '喜欢在乌东苗寨记录风景、手作与日常生活。',
			createTime: new Date(Date.now() - i * 1000 * 60 * 60 * 18).toISOString()
		};
	});
}
const mockDB = reactive<UserItem[]>(createMockUsers());
const mockService = {
	async page(data: { page: number; size: number; nickName?: string; status?: UserStatus; gender?: Gender; loginType?: LoginType }) {
		let rows = [...mockDB];
		if (data.nickName) rows = rows.filter(row => `${row.nickName} ${row.phone}`.includes(data.nickName!));
		if (data.status !== undefined && data.status !== '') rows = rows.filter(row => row.status === data.status);
		if (data.gender !== undefined && data.gender !== '') rows = rows.filter(row => row.gender === data.gender);
		if (data.loginType !== undefined && data.loginType !== '') rows = rows.filter(row => row.loginType === data.loginType);
		const start = (data.page - 1) * data.size;
		return { list: rows.slice(start, start + data.size), pagination: { page: data.page, size: data.size, total: rows.length } };
	},
	async info(params: { id: number }) { return mockDB.find(row => row.id === params.id) || null; },
	async update(data: Partial<UserItem> & { id: number }) { const index = mockDB.findIndex(row => row.id === data.id); if (index >= 0) mockDB[index] = { ...mockDB[index], ...data }; return true; },
	async delete(data: { ids: number[] }) { data.ids.forEach(id => { const index = mockDB.findIndex(row => row.id === id); if (index >= 0) mockDB.splice(index, 1); }); return true; },
	async add(data: Partial<UserItem>) {
		const id = Math.max(...mockDB.map(row => row.id), 2000) + 1;
		mockDB.unshift({ id, unionid: `wudong-user-${id}`, avatarUrl: data.avatarUrl || avatarPool[id % avatarPool.length], nickName: data.nickName || '新用户', phone: data.phone || '', gender: (data.gender ?? 0) as Gender, status: (data.status ?? 1) as UserStatus, loginType: (data.loginType ?? 2) as LoginType, description: data.description || '', createTime: new Date().toISOString() });
		return true;
	}
};

let useRemote = false;
const userService = {
	async page(data: any) {
		try {
			const result = await service.user.info.page(data);
			if (result?.list?.length) {
				useRemote = true;
				return result;
			}
		} catch {
			// 本地演示数据兜底
		}
		useRemote = false;
		return mockService.page(data);
	},
	async info(data: any) { return useRemote ? service.user.info.info(data) : mockService.info(data); },
	async update(data: any) { return useRemote ? service.user.info.update(data) : mockService.update(data); },
	async delete(data: any) { return useRemote ? service.user.info.delete(data) : mockService.delete(data); },
	async add(data: any) { return useRemote ? service.user.info.add(data) : mockService.add(data); }
};

async function toggleStatus(id: number, status: UserStatus) {
	const label = status === 1 ? '启用' : '禁用';
	try { await ElMessageBox.confirm(`确认${label}该用户？`, '状态确认', { type: 'warning' }); await mockService.update({ id, status }); ElMessage.success(`用户已${label}`); Crud.value?.refresh(); } catch { /* cancel */ }
}
function formatTime(value: string) { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; }

const Table = useTable({ columns: [
	{ type: 'selection', width: 54 }, { label: '用户', prop: 'nickName', minWidth: 190, showOverflowTooltip: true },
	{ label: '头像', prop: 'avatarUrl', width: 86, component: { name: 'cl-avatar', props: { size: 34 } } }, { label: '手机号', prop: 'phone', width: 132 },
	{ label: '性别', prop: 'gender', width: 86, dict: options.gender }, { label: '登录方式', prop: 'loginType', width: 105, dict: options.loginType },
	{ label: '状态', prop: 'status', width: 90, dict: options.status }, { label: '注册时间', prop: 'createTime', width: 168, sortable: 'desc', component: { name: 'el-text', props: { size: 'small' }, valuePrepare: (row: UserItem) => formatTime(row.createTime) } },
	{ label: '操作', type: 'op', width: 152, buttons: ({ scope }: { scope: { row: UserItem } }) => [
		{ label: '', type: 'primary', props: { icon: View, size: 'small', title: '查看用户', 'aria-label': '查看用户' }, onClick: () => Crud.value?.rowEdit(scope.row) },
		{ label: '', type: 'primary', props: { icon: Edit, size: 'small', title: '编辑用户', 'aria-label': '编辑用户' }, onClick: () => Crud.value?.rowEdit(scope.row) },
		scope.row.status === 1 ? { label: '', type: 'warning', props: { icon: Bottom, size: 'small', title: '禁用用户', 'aria-label': '禁用用户' }, onClick: () => toggleStatus(scope.row.id, 0) } : { label: '', type: 'success', props: { icon: Top, size: 'small', title: '启用用户', 'aria-label': '启用用户' }, onClick: () => toggleStatus(scope.row.id, 1) },
		{ label: '', type: 'danger', props: { icon: Delete, size: 'small', title: '删除用户', 'aria-label': '删除用户' }, confirm: '确认删除该用户？删除后不可恢复。', onClick: () => undefined }
	] }
] });

const Upsert = useUpsert({ dialog: { width: '720px', height: '70vh', class: 'user-upsert-dialog' }, props: { labelPosition: 'top' }, op: { saveButtonText: '保存用户', closeButtonText: '取消' }, items: [
	{ prop: 'nickName', label: '昵称', span: 12, component: { name: 'el-input', props: { maxlength: 30, placeholder: '输入用户昵称' } }, required: true },
	{ prop: 'phone', label: '手机号', span: 12, component: { name: 'el-input', props: { maxlength: 11, placeholder: '输入手机号' } } },
	{ prop: 'avatarUrl', label: '头像', span: 24, component: { name: 'cl-upload' } },
	{ prop: 'gender', label: '性别', span: 12, value: 0, component: { name: 'el-radio-group', options: options.gender } },
	{ prop: 'loginType', label: '登录方式', span: 12, value: 2, component: { name: 'el-radio-group', options: options.loginType } },
	{ prop: 'status', label: '状态', span: 24, value: 1, component: { name: 'el-radio-group', options: options.status } },
	{ prop: 'description', label: '个人简介', span: 24, component: { name: 'el-input', props: { type: 'textarea', rows: 5, maxlength: 240, showWordLimit: true, placeholder: '补充用户兴趣或备注信息' } } }
] });

const Search = useSearch({ items: [
	{ prop: 'status', label: '状态', component: { name: 'el-select', options: statusFilterOptions, props: { clearable: true, placeholder: '全部状态' } } },
	{ prop: 'gender', label: '性别', component: { name: 'el-select', options: genderFilterOptions, props: { clearable: true, placeholder: '全部性别' } } },
	{ prop: 'loginType', label: '登录方式', component: { name: 'el-select', options: loginTypeFilterOptions, props: { clearable: true, placeholder: '全部方式' } } },
	{ prop: 'nickName', label: '关键词', component: { name: 'el-input', props: { clearable: true, placeholder: '昵称或手机号' } } }
] });
const Crud = useCrud({ service: userService }, app => { app.refresh(); });
</script>

<style scoped lang="scss">
:deep(.user-toolbar) { align-items: center; }
:deep(.user-upsert-dialog) {
	.el-dialog { overflow: hidden; border-radius: 10px; }
	.el-dialog__header { margin-right: 0; padding: 20px 26px; border-bottom: 1px solid #e4e8ef; background: #fafbfc; }
	.el-dialog__title { color: #202b3c; font-size: 18px; font-weight: 700; }
	.el-dialog__body { padding: 24px 26px 8px; }
	.el-dialog__footer { padding: 14px 26px; border-top: 1px solid #e4e8ef; }
	.el-form-item__label { color: #536174; font-weight: 650; }
	.el-input__wrapper, .el-textarea__inner { box-shadow: 0 0 0 1px #dce3ec inset; }
	.el-input__wrapper.is-focus, .el-textarea__inner:focus { box-shadow: 0 0 0 1px #3f6edb inset; }
}
</style>
