import { successResponse } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, topic } = body;
    let result = "";
    if (action === "mnemonic") result = `记忆口诀：${topic} —— 「系分备考，稳如泰山」`;
    else if (action === "analogy") result = `类比解释：${topic} 就像是城市交通系统，需要规划、调度与优化。`;
    else if (action === "feynman") result = `费曼式反问：如果向一个初中生解释「${topic}」，你会怎么说？`;
    else result = `已生成关于「${topic}」的${action}内容。`;
    return successResponse({ result });
  } catch (e: any) {
    return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message: e.message } }, { status: 500 });
  }
}
