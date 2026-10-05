export const BLOCKS={
sky:{name:"Sky",solid:false,tool:null,tier:0,hardness:0,color:"#6aa3d5"},
grass:{name:"Grass",solid:true,tool:"shovel",tier:1,hardness:380,color:"#6d9a42"},
soil:{name:"Dirt",solid:true,tool:"shovel",tier:1,hardness:330,color:"#795235"},
sand:{name:"Sand",solid:true,tool:"shovel",tier:1,hardness:280,color:"#d4bd72"},
water:{name:"Water",solid:false,tool:"vacuum",tier:1,hardness:200,color:"#4f93d5"},
stone:{name:"Stone",solid:true,tool:"pickaxe",tier:1,hardness:650,color:"#777"},
coal:{name:"Coal",solid:true,tool:"pickaxe",tier:1,hardness:760,color:"#333"},
iron:{name:"Iron",solid:true,tool:"pickaxe",tier:2,hardness:880,color:"#b6a998"},
gold:{name:"Gold",solid:true,tool:"pickaxe",tier:2,hardness:1050,color:"#e2bd36"},
diamond:{name:"Diamond",solid:true,tool:"pickaxe",tier:3,hardness:1300,color:"#45c7d7"},
wood:{name:"Wood",solid:true,tool:"axe",tier:1,hardness:520,color:"#7a4c27"},
leaves:{name:"Leaves",solid:true,tool:"axe",tier:1,hardness:220,color:"#2f7130"},
planks:{name:"Planks",solid:true,tool:"axe",tier:1,hardness:400,color:"#a66e39"},
glass:{name:"Glass",solid:true,tool:"pickaxe",tier:1,hardness:210,color:"#c7eef5"},
crafting:{name:"Crafting Table",solid:true,tool:"axe",tier:1,hardness:460,color:"#8c572c"},
furnace:{name:"Furnace",solid:true,tool:"pickaxe",tier:1,hardness:700,color:"#555"},
chest:{name:"Chest",solid:true,tool:"axe",tier:1,hardness:460,color:"#9c6b2f"},
cloud:{name:"Cloud",solid:false,tool:"vacuum",tier:1,hardness:180,color:"#eee"},
bedrock:{name:"Bedrock",solid:true,tool:null,tier:99,hardness:999999,color:"#303030"}
};
export const TOOLS={
shovel:{name:"Shovel",img:"./assets/images/woodenShovelTexture.png"},
pickaxe:{name:"Pickaxe",img:"./assets/images/woodenPickaxeTexture.png"},
axe:{name:"Axe",img:"./assets/images/woodenAxeTexture.png"},
vacuum:{name:"Vacuum",img:"./assets/images/vacuu.png"}
};
export const RECIPES=[
{name:"Planks ×4",cost:{wood:1},out:{planks:4}},
{name:"Crafting Table",cost:{planks:4,stone:2},out:{crafting:1}},
{name:"Chest",cost:{planks:6},out:{chest:1}},
{name:"Furnace",cost:{stone:8},out:{furnace:1}},
{name:"Glass ×2",cost:{sand:2},out:{glass:2}}
];
export const SMELT=[
{name:"Iron",cost:{stone:2,coal:1},out:{iron:1}},
{name:"Glass",cost:{sand:1,coal:1},out:{glass:1}}
];