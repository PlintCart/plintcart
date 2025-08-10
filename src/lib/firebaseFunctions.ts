import { getApp } from 'firebase/app';
import { getFunctions } from 'firebase/functions';

const app = getApp();
export const functions = getFunctions(app);
