export default {
    data(){
        return {
            email: '',
            password: '',
            passwordConfirm: ''
        }
    },
    template: `<div>
    <div><label>注册邮箱：</label><input type="email" v-model="email" placeholder="输入有效的邮箱" /></div>
    <div><label>注册密码：</label><input type="password" v-model="password" placeholder="输入密码" /></div>
    <div><label>确认密码：</label><input type="password" v-model="passwordConfirm" placeholder="再次输入密码" /></div>
    </div>`
};