/**
 * Run: npm run generate
 * Queries wiki portrait URLs → downloads all images → writes heroes.json
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMG_DIR = join(__dirname, "../public/heroes");
const JSON_OUT = join(__dirname, "../public/data/heroes.json");

// ─── Complete MLBB hero roster ────────────────────────────────────────────────
// [id, wikiName, roles[], lanes[], specialties[], tier, wr, pr, br, strong[], weak[]]
type H = {
  id: string; name: string; role: string[]; lane: string[];
  specialty: string[]; tier: string;
  winRate: number; pickRate: number; banRate: number;
  strongAgainst: string[]; weakAgainst: string[];
};

const ROSTER: H[] = [
  // TANKS
  { id:"tigreal",    name:"Tigreal",        role:["Tank"],             lane:["Roam"],         specialty:["Crowd Control","Initiator"], tier:"A", winRate:49.1, pickRate:6.8,  banRate:3.1,  strongAgainst:["chou","ling","fanny"],             weakAgainst:["esmeralda","paquito"] },
  { id:"franco",     name:"Franco",          role:["Tank"],             lane:["Roam"],         specialty:["Crowd Control","Hook"],      tier:"A", winRate:50.6, pickRate:6.3,  banRate:5.1,  strongAgainst:["lesley","beatrix","fanny"],         weakAgainst:["esmeralda","diggie","mathilda"] },
  { id:"hylos",      name:"Hylos",           role:["Tank","Support"],   lane:["Roam"],         specialty:["Crowd Control","Guard"],     tier:"B", winRate:49.5, pickRate:4.2,  banRate:1.8,  strongAgainst:["assassin"],                        weakAgainst:["esmeralda","valentina"] },
  { id:"johnson",    name:"Johnson",         role:["Tank"],             lane:["Roam"],         specialty:["Crowd Control","Initiator"], tier:"A", winRate:50.2, pickRate:5.7,  banRate:4.8,  strongAgainst:["lesley","beatrix","moskov"],        weakAgainst:["esmeralda","diggie","mathilda"] },
  { id:"lolita",     name:"Lolita",          role:["Tank","Support"],   lane:["Roam"],         specialty:["Guard","Crowd Control"],     tier:"A", winRate:50.9, pickRate:5.1,  banRate:4.3,  strongAgainst:["beatrix","lesley","brody"],         weakAgainst:["fanny","hayabusa"] },
  { id:"grock",      name:"Grock",           role:["Tank","Fighter"],   lane:["Roam","Exp"],   specialty:["Crowd Control","Guard"],     tier:"B", winRate:49.8, pickRate:4.4,  banRate:2.3,  strongAgainst:["lesley","beatrix","moskov"],        weakAgainst:["esmeralda","paquito","diggie"] },
  { id:"gatotkaca",  name:"Gatotkaca",       role:["Tank","Fighter"],   lane:["Roam","Exp"],   specialty:["Crowd Control","Initiator"], tier:"B", winRate:48.7, pickRate:4.1,  banRate:2.1,  strongAgainst:["assassin"],                        weakAgainst:["esmeralda","uranus"] },
  { id:"belerick",   name:"Belerick",        role:["Tank","Support"],   lane:["Roam"],         specialty:["Guard","Crowd Control"],     tier:"A", winRate:51.2, pickRate:5.6,  banRate:4.7,  strongAgainst:["ling","fanny"],                    weakAgainst:["esmeralda","diggie"] },
  { id:"khufra",     name:"Khufra",          role:["Tank"],             lane:["Roam"],         specialty:["Crowd Control","Initiator"], tier:"S", winRate:51.5, pickRate:9.3,  banRate:14.6, strongAgainst:["chou","fanny","ling","benedetta"],  weakAgainst:["esmeralda","mathilda"] },
  { id:"atlas",      name:"Atlas",           role:["Tank"],             lane:["Roam"],         specialty:["Crowd Control","Initiator"], tier:"S", winRate:52.1, pickRate:8.6,  banRate:12.7, strongAgainst:["chou","fanny","ling","lancelot"],   weakAgainst:["esmeralda","mathilda","diggie"] },
  { id:"barats",     name:"Barats",          role:["Tank","Fighter"],   lane:["Exp","Roam"],   specialty:["Crowd Control","Poke"],      tier:"B", winRate:49.0, pickRate:4.8,  banRate:2.6,  strongAgainst:["assassin"],                        weakAgainst:["esmeralda","uranus"] },
  { id:"edith",      name:"Edith",           role:["Tank","Marksman"],  lane:["Roam","Gold"],  specialty:["Crowd Control","Damage"],    tier:"A", winRate:50.5, pickRate:6.2,  banRate:5.8,  strongAgainst:["lesley","moskov"],                 weakAgainst:["chou","khufra"] },
  { id:"fredrinn",   name:"Fredrinn",        role:["Tank","Fighter"],   lane:["Exp","Roam"],   specialty:["Crowd Control","Charge"],    tier:"A", winRate:51.0, pickRate:6.9,  banRate:6.3,  strongAgainst:["assassin","mage"],                 weakAgainst:["esmeralda","uranus"] },
  { id:"chip",       name:"Chip",            role:["Tank","Support"],   lane:["Roam"],         specialty:["Crowd Control","Guard"],     tier:"A", winRate:51.3, pickRate:7.1,  banRate:8.2,  strongAgainst:["fanny","ling"],                    weakAgainst:["esmeralda","diggie"] },
  { id:"gloo",       name:"Gloo",            role:["Tank","Fighter"],   lane:["Exp","Jungle"], specialty:["Crowd Control","Charge"],    tier:"S", winRate:52.8, pickRate:8.4,  banRate:11.9, strongAgainst:["mage","marksman"],                 weakAgainst:["esmeralda","uranus"] },
  { id:"minotaur",   name:"Minotaur",        role:["Tank","Support"],   lane:["Roam"],         specialty:["Crowd Control","Guard"],     tier:"B", winRate:48.5, pickRate:3.8,  banRate:1.5,  strongAgainst:["assassin"],                        weakAgainst:["diggie","esmeralda"] },
  { id:"baxia",      name:"Baxia",           role:["Tank"],             lane:["Roam","Jungle"],specialty:["Damage","Crowd Control"],    tier:"B", winRate:49.2, pickRate:4.5,  banRate:2.8,  strongAgainst:["alucard","uranus"],                weakAgainst:["fanny","ling"] },
  { id:"akai",       name:"Akai",            role:["Tank"],             lane:["Roam"],         specialty:["Crowd Control","Initiator"], tier:"A", winRate:50.3, pickRate:5.4,  banRate:3.7,  strongAgainst:["marksman","mage"],                 weakAgainst:["esmeralda","diggie"] },
  { id:"uranus",     name:"Uranus",          role:["Tank"],             lane:["Exp","Roam"],   specialty:["Sustain","Guard"],           tier:"A", winRate:51.7, pickRate:5.9,  banRate:5.2,  strongAgainst:["assassin","fighter"],              weakAgainst:["baxia","esmeralda"] },
  // FIGHTERS
  { id:"alucard",    name:"Alucard",         role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Sustain","Chase"],           tier:"B", winRate:48.9, pickRate:5.3,  banRate:2.4,  strongAgainst:["assassin"],                        weakAgainst:["baxia","chou"] },
  { id:"chou",       name:"Chou",            role:["Fighter"],          lane:["Jungle","Exp"], specialty:["Crowd Control","Initiator"], tier:"S", winRate:51.8, pickRate:14.2, banRate:18.5, strongAgainst:["fanny","lancelot","benedetta","ling"],weakAgainst:["khufra","atlas","tigreal"] },
  { id:"lapu_lapu",  name:"Lapu-Lapu",       role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Damage","Crowd Control"],    tier:"B", winRate:48.4, pickRate:4.7,  banRate:2.2,  strongAgainst:["mage","marksman"],                 weakAgainst:["chou","khufra"] },
  { id:"freya",      name:"Freya",           role:["Fighter"],          lane:["Exp"],          specialty:["Charge","Burst"],            tier:"B", winRate:48.2, pickRate:3.9,  banRate:1.7,  strongAgainst:["tank"],                            weakAgainst:["chou","paquito"] },
  { id:"paquito",    name:"Paquito",         role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Burst","Chase"],             tier:"A", winRate:51.4, pickRate:7.9,  banRate:9.1,  strongAgainst:["tigreal","esmeralda","chou"],       weakAgainst:["atlas","khufra","diggie"] },
  { id:"jawhead",    name:"Jawhead",         role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Crowd Control","Initiator"], tier:"B", winRate:48.7, pickRate:4.9,  banRate:2.6,  strongAgainst:["chou","fanny","ling"],              weakAgainst:["atlas","diggie","khufra"] },
  { id:"minsitthar", name:"Minsitthar",      role:["Fighter"],          lane:["Exp"],          specialty:["Crowd Control","Guard"],     tier:"B", winRate:49.3, pickRate:4.1,  banRate:2.0,  strongAgainst:["fanny","ling","chou"],              weakAgainst:["esmeralda","paquito"] },
  { id:"badang",     name:"Badang",          role:["Fighter"],          lane:["Exp"],          specialty:["Burst","Crowd Control"],     tier:"B", winRate:48.1, pickRate:3.6,  banRate:1.9,  strongAgainst:["marksman"],                        weakAgainst:["chou","esmeralda"] },
  { id:"dyrroth",    name:"Dyrroth",         role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Burst","Chase"],             tier:"A", winRate:51.2, pickRate:7.3,  banRate:7.8,  strongAgainst:["tank","fighter"],                  weakAgainst:["chou","khufra"] },
  { id:"terizla",    name:"Terizla",         role:["Fighter"],          lane:["Exp"],          specialty:["Crowd Control","Damage"],    tier:"B", winRate:49.4, pickRate:4.3,  banRate:2.3,  strongAgainst:["tank"],                            weakAgainst:["fanny","lancelot"] },
  { id:"khaleed",    name:"Khaleed",         role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Sustain","Charge"],          tier:"A", winRate:50.8, pickRate:6.1,  banRate:5.6,  strongAgainst:["fighter","tank"],                  weakAgainst:["chou","paquito"] },
  { id:"phoveus",    name:"Phoveus",         role:["Fighter"],          lane:["Exp","Roam"],   specialty:["Crowd Control","Damage"],    tier:"A", winRate:51.6, pickRate:6.7,  banRate:7.1,  strongAgainst:["fanny","ling","chou","lancelot"],   weakAgainst:["esmeralda","atlas"] },
  { id:"yu_zhong",   name:"Yu Zhong",        role:["Fighter"],          lane:["Exp"],          specialty:["Sustain","Burst"],           tier:"A", winRate:50.9, pickRate:6.4,  banRate:6.0,  strongAgainst:["assassin","mage"],                 weakAgainst:["chou","khufra"] },
  { id:"yin",        name:"Yin",             role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Burst","Reap"],              tier:"A", winRate:51.1, pickRate:7.0,  banRate:7.5,  strongAgainst:["marksman","mage"],                 weakAgainst:["atlas","khufra"] },
  { id:"martis",     name:"Martis",          role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Burst","Chase"],             tier:"B", winRate:49.6, pickRate:5.2,  banRate:3.1,  strongAgainst:["fighter"],                         weakAgainst:["chou","paquito"] },
  { id:"aldous",     name:"Aldous",          role:["Fighter"],          lane:["Exp"],          specialty:["Charge","Burst"],            tier:"B", winRate:49.2, pickRate:5.1,  banRate:3.4,  strongAgainst:["lesley","moskov"],                 weakAgainst:["chou","paquito","atlas"] },
  { id:"alpha",      name:"Alpha",           role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Damage","Crowd Control"],    tier:"B", winRate:48.6, pickRate:3.8,  banRate:1.8,  strongAgainst:["fighter","tank"],                  weakAgainst:["chou","paquito"] },
  { id:"silvanna",   name:"Silvanna",        role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Crowd Control","Burst"],     tier:"A", winRate:50.7, pickRate:5.8,  banRate:5.3,  strongAgainst:["tank","fighter"],                  weakAgainst:["chou","esmeralda"] },
  { id:"guinevere",  name:"Guinevere",       role:["Fighter","Mage"],   lane:["Exp","Mid"],    specialty:["Burst","Crowd Control"],     tier:"A", winRate:51.5, pickRate:7.2,  banRate:8.0,  strongAgainst:["tank","fighter"],                  weakAgainst:["chou","khufra"] },
  { id:"thamuz",     name:"Thamuz",          role:["Fighter"],          lane:["Exp"],          specialty:["Damage","Sustain"],          tier:"A", winRate:50.4, pickRate:5.5,  banRate:4.8,  strongAgainst:["fighter","tank"],                  weakAgainst:["chou","paquito"] },
  { id:"ruby",       name:"Ruby",            role:["Fighter"],          lane:["Exp"],          specialty:["Crowd Control","Sustain"],   tier:"A", winRate:51.0, pickRate:5.7,  banRate:5.2,  strongAgainst:["assassin","fighter"],              weakAgainst:["esmeralda","chou"] },
  { id:"balmond",    name:"Balmond",         role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Burst","Damage"],            tier:"B", winRate:48.3, pickRate:3.5,  banRate:1.6,  strongAgainst:["assassin"],                        weakAgainst:["chou","esmeralda"] },
  { id:"hilda",      name:"Hilda",           role:["Fighter","Tank"],   lane:["Exp","Roam"],   specialty:["Burst","Chase"],             tier:"A", winRate:51.3, pickRate:6.0,  banRate:5.7,  strongAgainst:["mage","marksman"],                 weakAgainst:["chou","paquito"] },
  { id:"xborg",      name:"X.Borg",          role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Damage","Poke"],             tier:"B", winRate:49.7, pickRate:5.0,  banRate:3.0,  strongAgainst:["tank","fighter"],                  weakAgainst:["chou","esmeralda"] },
  { id:"bane",       name:"Bane",            role:["Fighter","Mage"],   lane:["Exp","Mid"],    specialty:["Poke","Damage"],             tier:"B", winRate:49.0, pickRate:3.9,  banRate:1.9,  strongAgainst:["tank","fighter"],                  weakAgainst:["chou"] },
  { id:"roger",      name:"Roger",           role:["Fighter","Marksman"],lane:["Exp","Jungle"],specialty:["Burst","Chase"],             tier:"B", winRate:48.8, pickRate:4.6,  banRate:2.7,  strongAgainst:["mage","support"],                  weakAgainst:["chou","khufra"] },
  { id:"sun",        name:"Sun",             role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Damage","Sustain"],          tier:"A", winRate:51.8, pickRate:7.4,  banRate:8.9,  strongAgainst:["tank","fighter"],                  weakAgainst:["chou","vale"] },
  { id:"leomord",    name:"Leomord",         role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Burst","Charge"],            tier:"B", winRate:49.5, pickRate:4.9,  banRate:2.9,  strongAgainst:["marksman"],                        weakAgainst:["chou","khufra"] },
  { id:"kaja",       name:"Kaja",            role:["Fighter","Support"],lane:["Roam"],         specialty:["Crowd Control","Guard"],     tier:"A", winRate:50.6, pickRate:5.3,  banRate:4.0,  strongAgainst:["mage","marksman"],                 weakAgainst:["diggie","atlas"] },
  { id:"arlott",     name:"Arlott",          role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Burst","Chase"],             tier:"A", winRate:51.4, pickRate:6.8,  banRate:7.4,  strongAgainst:["mage","marksman"],                 weakAgainst:["chou","khufra"] },
  { id:"suyou",      name:"Suyou",           role:["Fighter","Assassin"],lane:["Exp","Jungle"],specialty:["Burst","Reap"],             tier:"S", winRate:52.6, pickRate:9.1,  banRate:14.2, strongAgainst:["mage","marksman","tank"],           weakAgainst:["chou","atlas"] },
  { id:"lukas",      name:"Lukas",           role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Burst","Charge"],            tier:"A", winRate:51.0, pickRate:6.5,  banRate:6.1,  strongAgainst:["tank","fighter"],                  weakAgainst:["chou","paquito"] },
  { id:"hirara",     name:"Hirara",          role:["Fighter","Assassin"],lane:["Jungle","Exp"],specialty:["Burst","Chase"],            tier:"A", winRate:51.2, pickRate:6.3,  banRate:6.8,  strongAgainst:["mage","marksman"],                 weakAgainst:["khufra","chou"] },
  { id:"argus",      name:"Argus",           role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Burst","Sustain"],           tier:"B", winRate:48.4, pickRate:4.2,  banRate:2.0,  strongAgainst:["marksman"],                        weakAgainst:["chou","paquito"] },
  { id:"masha",      name:"Masha",           role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Damage","Sustain"],          tier:"B", winRate:48.8, pickRate:4.3,  banRate:2.1,  strongAgainst:["tank","fighter"],                  weakAgainst:["chou","paquito"] },
  { id:"aulus",      name:"Aulus",           role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Damage","Sustain"],          tier:"B", winRate:48.5, pickRate:4.0,  banRate:1.8,  strongAgainst:["fighter","tank"],                  weakAgainst:["chou"] },
  { id:"cici",       name:"Cici",            role:["Fighter"],          lane:["Exp","Jungle"], specialty:["Crowd Control","Chase"],     tier:"A", winRate:51.0, pickRate:6.4,  banRate:6.5,  strongAgainst:["fighter","tank"],                  weakAgainst:["chou","khufra"] },
  // ASSASSINS
  { id:"fanny",      name:"Fanny",           role:["Assassin"],         lane:["Jungle"],       specialty:["Reap","Chase"],              tier:"S", winRate:54.2, pickRate:7.3,  banRate:28.4, strongAgainst:["lesley","beatrix","moskov"],        weakAgainst:["chou","khufra","atlas"] },
  { id:"ling",       name:"Ling",            role:["Assassin"],         lane:["Jungle"],       specialty:["Reap","Chase"],              tier:"S", winRate:50.3, pickRate:12.8, banRate:22.1, strongAgainst:["fanny","lesley","moskov","beatrix"], weakAgainst:["khufra","saber","karina"] },
  { id:"benedetta",  name:"Benedetta",       role:["Assassin"],         lane:["Exp","Jungle"], specialty:["Reap","Damage"],             tier:"A", winRate:49.7, pickRate:9.4,  banRate:11.3, strongAgainst:["lesley","beatrix","moskov"],        weakAgainst:["chou","karina","saber"] },
  { id:"lancelot",   name:"Lancelot",        role:["Assassin"],         lane:["Jungle"],       specialty:["Reap","Chase"],              tier:"A", winRate:50.9, pickRate:10.2, banRate:9.7,  strongAgainst:["lesley","beatrix","kagura"],        weakAgainst:["chou","karina","atlas"] },
  { id:"hayabusa",   name:"Hayabusa",        role:["Assassin"],         lane:["Jungle"],       specialty:["Reap","Chase"],              tier:"A", winRate:51.0, pickRate:8.8,  banRate:7.6,  strongAgainst:["lesley","beatrix","kagura"],        weakAgainst:["khufra","chou","atlas"] },
  { id:"gusion",     name:"Gusion",          role:["Assassin"],         lane:["Jungle","Mid"], specialty:["Burst","Reap"],              tier:"A", winRate:50.6, pickRate:8.7,  banRate:8.2,  strongAgainst:["lesley","beatrix","kagura"],        weakAgainst:["chou","khufra","karina"] },
  { id:"karina",     name:"Karina",          role:["Assassin"],         lane:["Jungle"],       specialty:["Reap","Charge"],             tier:"B", winRate:48.9, pickRate:6.2,  banRate:2.8,  strongAgainst:["lancelot","gusion","benedetta"],    weakAgainst:["chou","tigreal","atlas"] },
  { id:"helcurt",    name:"Helcurt",         role:["Assassin"],         lane:["Jungle"],       specialty:["Reap","Chase"],              tier:"B", winRate:48.7, pickRate:5.1,  banRate:3.2,  strongAgainst:["support","marksman"],              weakAgainst:["chou","khufra"] },
  { id:"hanzo",      name:"Hanzo",           role:["Assassin"],         lane:["Jungle"],       specialty:["Reap","Damage"],             tier:"B", winRate:49.1, pickRate:4.3,  banRate:2.5,  strongAgainst:["marksman","mage"],                 weakAgainst:["chou","atlas"] },
  { id:"natalia",    name:"Natalia",         role:["Assassin","Support"],lane:["Jungle","Roam"],specialty:["Reap","Chase"],             tier:"A", winRate:51.4, pickRate:6.9,  banRate:8.7,  strongAgainst:["marksman","support"],              weakAgainst:["chou","atlas"] },
  { id:"yi_sun_shin",name:"Yi Sun-shin",     role:["Assassin","Marksman"],lane:["Jungle"],     specialty:["Reap","Poke"],              tier:"B", winRate:49.3, pickRate:4.7,  banRate:2.7,  strongAgainst:["marksman"],                        weakAgainst:["chou","khufra"] },
  { id:"joy",        name:"Joy",             role:["Assassin"],         lane:["Jungle","Mid"], specialty:["Burst","Chase"],             tier:"A", winRate:51.8, pickRate:8.1,  banRate:10.2, strongAgainst:["mage","marksman"],                 weakAgainst:["chou","khufra","phoveus"] },
  { id:"nolan",      name:"Nolan",           role:["Assassin"],         lane:["Jungle"],       specialty:["Burst","Reap"],              tier:"S", winRate:52.4, pickRate:9.6,  banRate:17.3, strongAgainst:["mage","marksman","tank"],           weakAgainst:["chou","atlas","phoveus"] },
  { id:"julian",     name:"Julian",          role:["Fighter","Mage"],   lane:["Exp","Mid","Jungle"],specialty:["Burst","Reap"],         tier:"A", winRate:51.3, pickRate:7.5,  banRate:8.8,  strongAgainst:["mage","marksman"],                 weakAgainst:["chou","khufra"] },
  { id:"zetian",     name:"Zetian",          role:["Assassin"],         lane:["Jungle","Mid"], specialty:["Burst","Reap"],              tier:"A", winRate:51.5, pickRate:7.2,  banRate:9.1,  strongAgainst:["mage","support"],                  weakAgainst:["chou","phoveus"] },
  { id:"kalea",      name:"Kalea",           role:["Assassin","Tank"],  lane:["Roam","Jungle"],specialty:["Crowd Control","Initiator"], tier:"A", winRate:51.0, pickRate:6.4,  banRate:7.2,  strongAgainst:["marksman","mage"],                 weakAgainst:["diggie","atlas"] },
  { id:"saber",      name:"Saber",           role:["Assassin"],         lane:["Jungle"],       specialty:["Burst","Reap"],              tier:"B", winRate:49.0, pickRate:4.9,  banRate:2.4,  strongAgainst:["ling","lancelot","harith"],         weakAgainst:["chou","khufra"] },
  { id:"zilong",     name:"Zilong",          role:["Fighter","Assassin"],lane:["Jungle","Exp"],specialty:["Chase","Damage"],           tier:"B", winRate:48.5, pickRate:4.1,  banRate:1.9,  strongAgainst:["marksman"],                        weakAgainst:["chou","khufra"] },
  { id:"aamon",      name:"Aamon",           role:["Assassin"],         lane:["Jungle","Mid"], specialty:["Burst","Reap"],              tier:"A", winRate:51.0, pickRate:6.7,  banRate:7.9,  strongAgainst:["mage","marksman"],                 weakAgainst:["chou","atlas","phoveus"] },
  { id:"harley",     name:"Harley",          role:["Assassin","Mage"],  lane:["Mid","Jungle"], specialty:["Burst","Reap"],              tier:"A", winRate:51.6, pickRate:6.8,  banRate:6.2,  strongAgainst:["lesley","moskov","kagura"],         weakAgainst:["chou","khufra","atlas"] },
  { id:"selena",     name:"Selena",          role:["Assassin","Mage"],  lane:["Mid","Jungle"], specialty:["Burst","Crowd Control"],     tier:"A", winRate:51.2, pickRate:7.3,  banRate:9.4,  strongAgainst:["marksman","support"],              weakAgainst:["chou","phoveus"] },
  { id:"obsidia",    name:"Obsidia",         role:["Assassin","Fighter"],lane:["Jungle","Exp"],specialty:["Burst","Reap"],             tier:"A", winRate:51.3, pickRate:6.6,  banRate:7.5,  strongAgainst:["mage","marksman"],                 weakAgainst:["chou","khufra"] },
  // MAGES
  { id:"kagura",     name:"Kagura",          role:["Mage"],             lane:["Mid"],          specialty:["Poke","Burst"],              tier:"A", winRate:51.2, pickRate:8.4,  banRate:7.9,  strongAgainst:["chou","tigreal","atlas"],           weakAgainst:["valentina","lancelot","beatrix"] },
  { id:"valentina",  name:"Valentina",       role:["Mage"],             lane:["Mid"],          specialty:["Poke","Burst"],              tier:"S", winRate:51.9, pickRate:10.5, banRate:20.3, strongAgainst:["yve","kagura","esmeralda"],         weakAgainst:["lancelot","ling","benedetta"] },
  { id:"yve",        name:"Yve",             role:["Mage"],             lane:["Mid"],          specialty:["Area Damage","Crowd Control"],tier:"A",winRate:50.4, pickRate:7.6,  banRate:6.8,  strongAgainst:["tigreal","atlas","khufra"],         weakAgainst:["valentina","lancelot","benedetta"] },
  { id:"lunox",      name:"Lunox",           role:["Mage"],             lane:["Mid"],          specialty:["Burst","Reap"],              tier:"S", winRate:52.4, pickRate:9.7,  banRate:15.8, strongAgainst:["chou","tigreal","atlas"],           weakAgainst:["valentina","lancelot","benedetta"] },
  { id:"esmeralda",  name:"Esmeralda",       role:["Tank","Mage"],      lane:["Exp","Roam"],   specialty:["Shield","Sustain"],          tier:"A", winRate:52.8, pickRate:9.1,  banRate:10.4, strongAgainst:["tigreal","khufra","atlas"],         weakAgainst:["valentina","yve","diggie"] },
  { id:"harith",     name:"Harith",          role:["Mage"],             lane:["Mid"],          specialty:["Burst","Mobility"],          tier:"A", winRate:50.8, pickRate:7.2,  banRate:8.9,  strongAgainst:["tigreal","atlas","chou"],           weakAgainst:["valentina","khufra"] },
  { id:"lylia",      name:"Lylia",           role:["Mage"],             lane:["Mid"],          specialty:["Burst","Poke"],              tier:"B", winRate:49.5, pickRate:5.3,  banRate:3.7,  strongAgainst:["tigreal","atlas"],                 weakAgainst:["valentina","lancelot","benedetta"] },
  { id:"nana",       name:"Nana",            role:["Mage","Support"],   lane:["Mid","Roam"],   specialty:["Crowd Control","Poke"],      tier:"A", winRate:51.1, pickRate:6.5,  banRate:6.0,  strongAgainst:["assassin"],                        weakAgainst:["valentina"] },
  { id:"cyclops",    name:"Cyclops",         role:["Mage"],             lane:["Mid"],          specialty:["Burst","Poke"],              tier:"B", winRate:49.3, pickRate:5.0,  banRate:2.9,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"aurora",     name:"Aurora",          role:["Mage"],             lane:["Mid"],          specialty:["Burst","Crowd Control"],     tier:"B", winRate:49.0, pickRate:4.7,  banRate:2.3,  strongAgainst:["fighter","tank"],                  weakAgainst:["assassin"] },
  { id:"gord",       name:"Gord",            role:["Mage"],             lane:["Mid"],          specialty:["Burst","Poke"],              tier:"B", winRate:48.7, pickRate:4.4,  banRate:1.9,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"odette",     name:"Odette",          role:["Mage"],             lane:["Mid"],          specialty:["Burst","Area Damage"],       tier:"B", winRate:48.9, pickRate:4.6,  banRate:2.1,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"eudora",     name:"Eudora",          role:["Mage"],             lane:["Mid"],          specialty:["Burst","Poke"],              tier:"B", winRate:49.1, pickRate:4.8,  banRate:2.4,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"zhask",      name:"Zhask",           role:["Mage"],             lane:["Mid"],          specialty:["Burst","Summon"],            tier:"B", winRate:48.8, pickRate:4.3,  banRate:2.0,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"kadita",     name:"Kadita",          role:["Mage","Assassin"],  lane:["Mid","Jungle"], specialty:["Burst","Chase"],             tier:"A", winRate:50.5, pickRate:5.8,  banRate:4.9,  strongAgainst:["fighter","tank"],                  weakAgainst:["valentina","lancelot"] },
  { id:"change",     name:"Chang'e",         role:["Mage"],             lane:["Mid"],          specialty:["Burst","Poke"],              tier:"A", winRate:51.0, pickRate:6.2,  banRate:5.8,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin","lancelot"] },
  { id:"cecilion",   name:"Cecilion",        role:["Mage"],             lane:["Mid"],          specialty:["Burst","Poke"],              tier:"A", winRate:51.5, pickRate:6.9,  banRate:7.2,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"vexana",     name:"Vexana",          role:["Mage"],             lane:["Mid"],          specialty:["Burst","Summon"],            tier:"B", winRate:49.2, pickRate:4.5,  banRate:2.6,  strongAgainst:["fighter","tank"],                  weakAgainst:["assassin"] },
  { id:"alice",      name:"Alice",           role:["Mage"],             lane:["Mid"],          specialty:["Sustain","Damage"],          tier:"B", winRate:48.9, pickRate:4.0,  banRate:2.0,  strongAgainst:["fighter","tank"],                  weakAgainst:["assassin"] },
  { id:"pharsa",     name:"Pharsa",          role:["Mage"],             lane:["Mid"],          specialty:["Burst","Poke"],              tier:"A", winRate:50.7, pickRate:6.0,  banRate:5.5,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"xavier",     name:"Xavier",          role:["Mage"],             lane:["Mid"],          specialty:["Burst","Poke"],              tier:"A", winRate:51.3, pickRate:7.1,  banRate:8.0,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin","lancelot"] },
  { id:"novaria",    name:"Novaria",         role:["Mage"],             lane:["Mid"],          specialty:["Burst","Crowd Control"],     tier:"A", winRate:51.0, pickRate:6.4,  banRate:6.7,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"valir",      name:"Valir",           role:["Mage"],             lane:["Mid","Roam"],   specialty:["Burst","Crowd Control"],     tier:"A", winRate:50.9, pickRate:6.3,  banRate:6.1,  strongAgainst:["fighter","tank"],                  weakAgainst:["assassin"] },
  { id:"faramis",    name:"Faramis",         role:["Mage","Support"],   lane:["Mid","Roam"],   specialty:["Burst","Guard"],             tier:"B", winRate:49.3, pickRate:4.6,  banRate:2.7,  strongAgainst:["assassin"],                        weakAgainst:["lancelot"] },
  { id:"zhuxin",     name:"Zhuxin",          role:["Mage"],             lane:["Mid"],          specialty:["Burst","Crowd Control"],     tier:"A", winRate:51.7, pickRate:7.8,  banRate:10.1, strongAgainst:["tank","fighter"],                  weakAgainst:["assassin","valentina"] },
  { id:"luo_yi",     name:"Luo Yi",          role:["Mage"],             lane:["Mid"],          specialty:["Crowd Control","Burst"],     tier:"A", winRate:51.4, pickRate:6.6,  banRate:7.3,  strongAgainst:["fighter","tank"],                  weakAgainst:["assassin"] },
  { id:"kimmy",      name:"Kimmy",           role:["Mage","Marksman"],  lane:["Mid","Gold"],   specialty:["Burst","Poke"],              tier:"B", winRate:49.0, pickRate:4.8,  banRate:2.5,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"vale",       name:"Vale",            role:["Mage"],             lane:["Mid"],          specialty:["Burst","Crowd Control"],     tier:"A", winRate:50.6, pickRate:5.9,  banRate:5.0,  strongAgainst:["fighter","sun"],                   weakAgainst:["assassin"] },
  { id:"phoveus2",   name:"Phoveus",         role:["Fighter"],          lane:["Exp","Roam"],   specialty:["Crowd Control","Damage"],    tier:"A", winRate:51.6, pickRate:6.7,  banRate:7.1,  strongAgainst:["fanny","ling","chou","lancelot"],   weakAgainst:["esmeralda","atlas"] },
  { id:"natan",      name:"Natan",           role:["Marksman","Mage"],  lane:["Gold"],         specialty:["Damage","Burst"],            tier:"A", winRate:51.0, pickRate:6.6,  banRate:6.3,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"sora",       name:"Sora",            role:["Mage","Marksman"],  lane:["Mid","Gold"],   specialty:["Burst","Poke"],              tier:"A", winRate:51.6, pickRate:7.5,  banRate:9.3,  strongAgainst:["fighter","tank"],                  weakAgainst:["assassin","valentina"] },
  { id:"luo_yi2",    name:"Luo Yi",          role:["Mage"],             lane:["Mid"],          specialty:["Crowd Control","Burst"],     tier:"A", winRate:51.4, pickRate:6.6,  banRate:7.3,  strongAgainst:["fighter","tank"],                  weakAgainst:["assassin"] },
  { id:"marcel",     name:"Marcel",          role:["Mage"],             lane:["Mid"],          specialty:["Burst","Crowd Control"],     tier:"A", winRate:51.1, pickRate:6.7,  banRate:7.0,  strongAgainst:["fighter","tank"],                  weakAgainst:["assassin"] },
  // MARKSMEN
  { id:"lesley",     name:"Lesley",          role:["Marksman"],         lane:["Gold"],         specialty:["Reap","Damage"],             tier:"A", winRate:52.3, pickRate:8.1,  banRate:4.2,  strongAgainst:["moskov","miya"],                   weakAgainst:["ling","lancelot","benedetta","gusion"] },
  { id:"beatrix",    name:"Beatrix",         role:["Marksman"],         lane:["Gold"],         specialty:["Damage","Burst"],            tier:"S", winRate:53.1, pickRate:11.6, banRate:19.8, strongAgainst:["lesley","moskov","miya"],           weakAgainst:["ling","lancelot","benedetta"] },
  { id:"moskov",     name:"Moskov",          role:["Marksman"],         lane:["Gold"],         specialty:["Damage","Poke"],             tier:"B", winRate:48.4, pickRate:5.9,  banRate:2.1,  strongAgainst:["lesley"],                          weakAgainst:["ling","fanny","lancelot","benedetta","beatrix"] },
  { id:"miya",       name:"Miya",            role:["Marksman"],         lane:["Gold"],         specialty:["Damage","Reap"],             tier:"B", winRate:48.7, pickRate:5.6,  banRate:2.0,  strongAgainst:[],                                  weakAgainst:["ling","fanny","lancelot"] },
  { id:"layla",      name:"Layla",           role:["Marksman"],         lane:["Gold"],         specialty:["Damage","Poke"],             tier:"C", winRate:47.8, pickRate:4.2,  banRate:0.9,  strongAgainst:[],                                  weakAgainst:["assassin"] },
  { id:"bruno",      name:"Bruno",           role:["Marksman"],         lane:["Gold"],         specialty:["Damage","Reap"],             tier:"B", winRate:49.4, pickRate:5.7,  banRate:2.6,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"clint",      name:"Clint",           role:["Marksman","Fighter"],lane:["Gold"],        specialty:["Burst","Poke"],              tier:"A", winRate:51.0, pickRate:6.8,  banRate:5.9,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"karrie",     name:"Karrie",          role:["Marksman"],         lane:["Gold"],         specialty:["Damage","Reap"],             tier:"A", winRate:51.7, pickRate:7.4,  banRate:7.8,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"irithel",    name:"Irithel",         role:["Marksman"],         lane:["Gold"],         specialty:["Damage","Poke"],             tier:"B", winRate:49.2, pickRate:4.9,  banRate:2.3,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"wanwan",     name:"Wanwan",          role:["Marksman"],         lane:["Gold"],         specialty:["Reap","Damage"],             tier:"A", winRate:51.5, pickRate:7.6,  banRate:8.4,  strongAgainst:["fighter","tank"],                  weakAgainst:["chou","khufra"] },
  { id:"granger",    name:"Granger",         role:["Marksman","Assassin"],lane:["Gold","Jungle"],specialty:["Burst","Reap"],           tier:"A", winRate:51.1, pickRate:7.0,  banRate:6.5,  strongAgainst:["fighter","mage"],                  weakAgainst:["assassin"] },
  { id:"brody",      name:"Brody",           role:["Marksman"],         lane:["Gold"],         specialty:["Burst","Poke"],              tier:"A", winRate:50.8, pickRate:6.5,  banRate:5.8,  strongAgainst:["tank","fighter"],                  weakAgainst:["assassin"] },
  { id:"popol_kupa", name:"Popol and Kupa",  role:["Marksman","Support"],lane:["Gold","Roam"], specialty:["Poke","Crowd Control"],     tier:"B", winRate:49.6, pickRate:5.2,  banRate:3.1,  strongAgainst:["mage","support"],                  weakAgainst:["assassin"] },
  { id:"melissa",    name:"Melissa",         role:["Marksman"],         lane:["Gold"],         specialty:["Damage","Guard"],            tier:"A", winRate:51.3, pickRate:6.9,  banRate:6.7,  strongAgainst:["assassin","fighter"],              weakAgainst:["chou","khufra"] },
  { id:"ixia",       name:"Ixia",            role:["Marksman"],         lane:["Gold"],         specialty:["Damage","Poke"],             tier:"A", winRate:51.8, pickRate:8.3,  banRate:10.5, strongAgainst:["fighter","tank"],                  weakAgainst:["assassin"] },
  { id:"hanabi",     name:"Hanabi",          role:["Marksman"],         lane:["Gold"],         specialty:["Damage","Guard"],            tier:"B", winRate:49.8, pickRate:5.5,  banRate:3.4,  strongAgainst:["assassin"],                        weakAgainst:["chou","khufra"] },
  { id:"claude",     name:"Claude",          role:["Marksman"],         lane:["Gold"],         specialty:["Damage","Mobility"],         tier:"A", winRate:51.6, pickRate:7.8,  banRate:9.0,  strongAgainst:["tank","fighter"],                  weakAgainst:["chou","khufra"] },
  // SUPPORTS
  { id:"rafaela",    name:"Rafaela",         role:["Support"],          lane:["Roam"],         specialty:["Heal","Guard"],              tier:"B", winRate:49.5, pickRate:4.4,  banRate:2.0,  strongAgainst:["assassin"],                        weakAgainst:["lancelot","valentina"] },
  { id:"angela",     name:"Angela",          role:["Support"],          lane:["Roam"],         specialty:["Guard","Heal"],              tier:"A", winRate:51.7, pickRate:7.5,  banRate:9.2,  strongAgainst:["assassin"],                        weakAgainst:["lancelot","chou"] },
  { id:"diggie",     name:"Diggie",          role:["Support"],          lane:["Roam"],         specialty:["Crowd Control","Guard"],     tier:"A", winRate:50.8, pickRate:5.4,  banRate:7.3,  strongAgainst:["atlas","tigreal","khufra","esmeralda"],weakAgainst:["valentina","lancelot"] },
  { id:"mathilda",   name:"Mathilda",        role:["Support","Assassin"],lane:["Roam"],        specialty:["Mobility","Crowd Control"],  tier:"S", winRate:52.7, pickRate:8.9,  banRate:16.2, strongAgainst:["khufra","tigreal","atlas"],         weakAgainst:["saber","karina","chou"] },
  { id:"estes",      name:"Estes",           role:["Support"],          lane:["Roam"],         specialty:["Heal","Guard"],              tier:"S", winRate:53.2, pickRate:8.7,  banRate:13.4, strongAgainst:["assassin","fighter"],              weakAgainst:["lancelot","valentina"] },
  { id:"floryn",     name:"Floryn",          role:["Support"],          lane:["Roam"],         specialty:["Heal","Guard"],              tier:"A", winRate:51.5, pickRate:6.8,  banRate:6.4,  strongAgainst:["assassin"],                        weakAgainst:["valentina","lancelot"] },
  { id:"carmilla",   name:"Carmilla",        role:["Support","Tank"],   lane:["Roam"],         specialty:["Crowd Control","Guard"],     tier:"A", winRate:50.9, pickRate:5.6,  banRate:4.8,  strongAgainst:["marksman","mage"],                 weakAgainst:["diggie","esmeralda"] },
];

// Deduplicate by id (keep first occurrence)
const seenIds = new Set<string>();
const HEROES = ROSTER.filter((h) => {
  if (seenIds.has(h.id)) return false;
  seenIds.add(h.id);
  return true;
});

async function getPortraitUrls(names: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const BATCH = 50;
  for (let i = 0; i < names.length; i += BATCH) {
    const batch = names.slice(i, i + BATCH);
    const titleStr = batch.map(encodeURIComponent).join("|");
    const url = `https://mobile-legends.fandom.com/api.php?action=query&prop=pageimages&titles=${titleStr}&pithumbsize=200&format=json`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "mlbb-draft/1.0" } });
      const json = (await res.json()) as {
        query?: { pages?: Record<string, { title: string; thumbnail?: { source: string } }> };
      };
      for (const page of Object.values(json?.query?.pages ?? {})) {
        const thumb = page.thumbnail?.source ?? "";
        result[page.title] = thumb.split("/revision/")[0];
      }
    } catch { /* continue */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  return result;
}

function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const get = (u: string) => {
      https.get(u, { headers: { "User-Agent": "mlbb-draft/1.0" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.headers.location) return get(res.headers.location);
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }).on("error", reject);
    };
    get(url);
  });
}

async function main() {
  if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });

  console.log(`\nGenerating ${HEROES.length} heroes...\n`);

  // Step 1: get portrait URLs
  const uniqueNames = [...new Set(HEROES.map((h) => h.name))];
  console.log("Fetching portrait URLs from wiki...");
  const portraits = await getPortraitUrls(uniqueNames);
  console.log(`Got ${Object.keys(portraits).length}/${uniqueNames.length} portrait URLs\n`);

  // Step 2: download images
  let ok = 0, fail = 0;
  for (const hero of HEROES) {
    const dest = join(IMG_DIR, `${hero.id}.webp`);
    const pUrl = portraits[hero.name];
    process.stdout.write(`  ${hero.id.padEnd(16)}`);
    if (!pUrl) { console.log("no image"); fail++; continue; }
    try {
      const buf = await fetchBuffer(pUrl);
      const { default: sharp } = await import("sharp");
      await sharp(buf).resize(64, 64, { fit: "cover", position: "top" }).webp({ quality: 88 }).toFile(dest);
      console.log("✓"); ok++;
    } catch (e) { console.log(`✗ ${(e as Error).message}`); fail++; }
  }
  console.log(`\nImages: ${ok} ok, ${fail} failed\n`);

  // Step 3: write JSON
  const json = HEROES.map((h) => ({
    id: h.id, name: h.name, role: h.role, lane: h.lane, specialty: h.specialty,
    tier: h.tier, winRate: h.winRate, pickRate: h.pickRate, banRate: h.banRate,
    counters: h.strongAgainst, counteredBy: h.weakAgainst,
    strongAgainst: h.strongAgainst, weakAgainst: h.weakAgainst,
    image: `/heroes/${h.id}.webp`, patch: "1.9.10",
  }));

  writeFileSync(JSON_OUT, JSON.stringify(json, null, 2));
  console.log(`✅ heroes.json written — ${json.length} heroes`);
}

main().catch((e) => { console.error(e); process.exit(1); });
