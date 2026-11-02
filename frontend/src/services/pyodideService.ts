/**
 * Pyodide Service — Secure in-browser Python execution
 */

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<any>;
  }
}

class PyodideService {
  private pyodide: any = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.pyodide) return;
    if (this.isInitializing && this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        // Dynamically inject the Pyodide script if not present
        if (!document.getElementById('pyodide-script')) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.id = 'pyodide-script';
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide CDN'));
            document.head.appendChild(script);
          });
        }

        // Initialize Pyodide
        this.pyodide = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });
        
        // Redirect stdout/stderr to custom variables so we can capture print() calls
        await this.pyodide.runPythonAsync(`
          import sys
          import io
          sys.stdout = io.StringIO()
          sys.stderr = io.StringIO()
        `);
      } catch (err) {
        console.error('Pyodide initialization failed:', err);
        throw err;
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Run student code against a specific test case string (e.g. `add(2, 3)`).
   * Returns { output, error, isCorrect }
   */
  async evaluateTestCase(code: string, testCaseInput: string, expectedOutput: string): Promise<{
    output: string;
    error?: string;
    isCorrect: boolean;
  }> {
    await this.init();

    try {
      // Clear previous stdout/stderr
      await this.pyodide.runPythonAsync(`
        sys.stdout.truncate(0)
        sys.stdout.seek(0)
        sys.stderr.truncate(0)
        sys.stderr.seek(0)
      `);

      // 1. Load the user's code into the global namespace
      await this.pyodide.runPythonAsync(code);

      // 2. Execute the test case evaluation
      // We wrap the test case in str() to match the expected string output format
      // If the input is empty (e.g. a simple variable check), we don't eval it directly.
      
      let pythonScript = '';
      if (testCaseInput.trim() === '') {
        // If there's no input expression, just check the output buffer 
        // This is for problems like "Hello Variables"
      } else {
        pythonScript = `__test_result__ = str(eval("""${testCaseInput.replace(/"/g, '\\"')}"""))`;
      }
      
      let executionError = '';
      let result = '';

      try {
        if (pythonScript) {
          await this.pyodide.runPythonAsync(pythonScript);
          result = this.pyodide.globals.get('__test_result__');
        }
      } catch (err: any) {
        executionError = err.message;
      }

      // Capture print outputs
      const stdout = await this.pyodide.runPythonAsync(`sys.stdout.getvalue()`);
      
      // Compare (normalize whitespace for robust checking)
      const cleanExpected = expectedOutput.trim();
      let isCorrect = false;

      if (executionError) {
        // Sometimes the expected output IS an error message (like "ValueError: Cannot divide by zero")
        if (executionError.includes(cleanExpected) || cleanExpected.includes(executionError)) {
            isCorrect = true;
            result = cleanExpected; // treat the expected error as the result
        } else {
            return {
              output: stdout,
              error: executionError,
              isCorrect: false
            };
        }
      } else {
        // If no testCaseInput, we check stdout
        if (!testCaseInput.trim()) {
          isCorrect = stdout.trim() === cleanExpected;
          result = stdout.trim();
        } else {
          isCorrect = result.trim() === cleanExpected;
        }
      }

      return {
        output: stdout,
        isCorrect
      };

    } catch (err: any) {
      // Syntax errors or top-level execution errors in the user code
      return {
        output: '',
        error: err.message,
        isCorrect: false
      };
    }
  }
}

export const pyodideService = new PyodideService();
