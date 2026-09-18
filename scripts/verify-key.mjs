// Secret input arrives through stdin, never a command-line argument or log.
let input='';for await(const chunk of process.stdin)input+=chunk;
try{
 const {key}=JSON.parse(input),anthropic=key.startsWith('sk-ant-');
 const response=await fetch(anthropic?'https://api.anthropic.com/v1/models':'https://api.openai.com/v1/models',{headers:anthropic?{'x-api-key':key,'anthropic-version':'2023-06-01'}:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(25000)});
 console.log(JSON.stringify({status:response.status}));
}catch{console.log(JSON.stringify({status:0}))}
