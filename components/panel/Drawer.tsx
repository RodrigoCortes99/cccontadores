"use client";
import Modal from './Modal';
type DrawerProps={open:boolean;title:string;onClose:()=>void;children:React.ReactNode};
export default function Drawer({open,title,onClose,children}:DrawerProps){return <Modal open={open} title={title} onClose={onClose} maxWidth={680}>{children}</Modal>;}
