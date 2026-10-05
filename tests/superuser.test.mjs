import test from 'node:test';
import assert from 'node:assert/strict';
import {isClientRole,isPrivileged,roleLabel} from '../lib/roles.ts';

test('persisted superuser authority is represented independently from the business role',()=>{
 const admin={role:'staff',is_superuser:true,organization_id:null};
 assert.equal(isPrivileged(admin),true);
 assert.equal(isClientRole(admin),false);
 assert.equal(roleLabel(admin.role,admin.is_superuser),'Administrador');
 assert.equal(admin.role,'staff');
});
test('ordinary portal and employee presentation preserve their current role',()=>{
 assert.equal(isClientRole({role:'client',is_superuser:false}),true);
 assert.equal(isPrivileged({role:'staff',is_superuser:false}),false);
 assert.equal(roleLabel('staff',false),'Equipo');
 assert.equal(roleLabel('manager',false),'Gerente');
});
