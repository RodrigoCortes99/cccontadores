"use client";
import {Suspense} from 'react';
import LegacyHome from './LegacyHome';
import {usePanelUser} from '../../lib/PanelUserContext';
import OperationalHome from '../../components/panel/OperationalHome';
import Onboarding from '../../components/panel/Onboarding';
import {isClientRole} from '../../lib/roles';
export default function Home(){const {user}=usePanelUser();return isClientRole(user)?<><Onboarding/><LegacyHome/></>:<Suspense fallback={<p>Cargando inicio…</p>}><OperationalHome/></Suspense>;}
