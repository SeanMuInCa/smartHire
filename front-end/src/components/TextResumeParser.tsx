import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { AiOutlineUpload, AiOutlineFile } from 'react-icons/ai';
import { BiLoaderAlt } from 'react-icons/bi';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

async function extractTextWithLines(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let full = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items
      .map((it: any) => ({
        x: it.transform[4],
        y: it.transform[5],
        str: it.str.trim(),
      }))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    const linesArr: { x: number; str: string }[][] = [];
    const TOL = 5;
    for (const it of items) {
      if (
        !linesArr.length ||
        Math.abs(it.y - (linesArr[linesArr.length - 1][0] as any).y) > TOL
      ) {
        linesArr.push([{ x: it.x, str: it.str }]);
      } else {
        linesArr[linesArr.length - 1].push({ x: it.x, str: it.str });
      }
    }
    for (const lineItems of linesArr) {
      full += lineItems.map(li => li.str).join(' ') + '\n';
    }
    full += '\n';
  }
  return full;
}

async function extractRawText(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return extractTextWithLines(file);
  }
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () =>
      reader.result ? res(reader.result as string) : rej('读取失败');
    reader.onerror = () => rej('读取失败');
    reader.readAsText(file);
  });
}

const TextResumeParser: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [rawText, setRawText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setError(null);
    setRawText('');
    
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.pdf') || selectedFile.name.endsWith('.txt')) {
        setFile(selectedFile);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 1500);
      } else {
        setFile(null);
        setError('请上传 PDF 或 TXT 文件');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    
    if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.type === 'text/plain' || droppedFile.name.endsWith('.pdf') || droppedFile.name.endsWith('.txt'))) {
      setFile(droppedFile);
      setError(null);
      setRawText('');
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 1500);
    } else {
      setError('请上传 PDF 或 TXT 文件');
    }
  };

  const extractText = async () => {
    if (!file) return;
    setIsExtracting(true);
    try {
      const raw = await extractRawText(file);
      setRawText(raw);
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setIsExtracting(false);
    }
  };
  
  const handleExtractButtonClick = () => {
    if (file) {
      extractText();
    }
  };

  const resetForm = () => {
    setFile(null);
    setRawText('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden animate-fadeIn">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold">简历文本提取工具</h1>
            <p className="mt-2 opacity-80">上传简历文件，提取原始文本内容</p>
          </div>
          
          <div className="p-6">
            <div 
              className={`border-2 border-dashed rounded-lg p-8 transition-all duration-300 ${
                error ? 'border-red-300 bg-red-50' : 
                file ? 'border-green-300 bg-green-50' : 
                'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.txt"
                className="hidden"
                ref={fileInputRef}
              />
              
              <div className="flex flex-col items-center justify-center text-center">
                {!file ? (
                  <>
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <AiOutlineUpload className="text-2xl" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">拖放文件或点击上传</h3>
                    <p className="mb-4 text-sm text-gray-500">支持 PDF 和 TXT 格式</p>
                    <button
                      onClick={triggerFileInput}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md"
                    >
                      选择文件
                    </button>
                  </>
                ) : (
                  <div className="animate-slideUp">
                    <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full ${uploadSuccess ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {uploadSuccess ? (
                        <FiCheckCircle className="text-2xl" />
                      ) : (
                        <AiOutlineFile className="text-2xl" />
                      )}
                    </div>
                    <h3 className="mb-1 text-lg font-medium">{file.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {(file.size / 1024).toFixed(1)} KB - {file.type || '未知类型'}
                    </p>
                    <div className="flex space-x-3 justify-center">
                      <button
                        onClick={resetForm}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        移除
                      </button>
                      <button
                        onClick={handleExtractButtonClick}
                        disabled={isExtracting}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-md transition-colors shadow-md ${
                          isExtracting ? 'opacity-75' : 'hover:bg-blue-700'
                        }`}
                      >
                        {isExtracting ? (
                          <span className="flex items-center">
                            <BiLoaderAlt className="animate-spin mr-2" />
                            提取中...
                          </span>
                        ) : (
                          '提取文本'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 animate-fadeIn">
                <div className="flex">
                  <FiXCircle className="mr-3 mt-0.5" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            {rawText && (
              <div className="mt-8 animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-800 mb-4">提取结果</h2>
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-auto max-h-96">
                  <pre className="text-sm whitespace-pre-wrap">{rawText}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>© 2025 简历文本提取工具 | 所有文本数据仅在本地处理，不会上传到服务器</p>
        </div>
      </div>
    </div>
  );
};

export default TextResumeParser;
