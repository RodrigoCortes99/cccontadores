import type {TextContent} from 'pdfjs-dist/types/src/display/api';

// Reader API works in Safari versions without ReadableStream async iteration.
export async function readPageText(stream:ReadableStream<TextContent>,active:()=>boolean,limit=50000):Promise<string> {
 const reader=stream.getReader();let text='';
 try {
  while(active()&&text.length<limit) {
   const chunk=await reader.read();if(chunk.done)break;
   text+=chunk.value.items.map(item=>'str' in item?item.str:'').join(' ')+' ';
  }
  return text.slice(0,limit).trim();
 }finally{await reader.cancel().catch(()=>{});}
}
