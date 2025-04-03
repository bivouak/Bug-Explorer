import { useEffect, useMemo, useState } from 'react'

type DirStat = {
  count: number
  isDirectory: boolean
}

const processFiles = (files: string[], basePath: string): { [key: string]: DirStat } => {
  const directories = {}

  files.forEach((file: string) => {
    if (!file.startsWith(basePath)) return

    const relativePath = file.slice(basePath.length)
    const parts = relativePath.split('/').filter(p => p)

    if (parts.length > 0) {
      const dir = parts[0]
      if (!directories[dir]) {
        directories[dir] = {
          count: 0,
          isDirectory: true,
        }
      }
      directories[dir].count++
      directories[dir].isDirectory = parts.length > 1
    }
  })

  return directories
}

const BugExplorer = () => {
  const [currentPath, setCurrentPath] = useState<string>('')
  const fileStatsPath = '/bugs.csv'

  const [files, setFiles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const content = await fetch(fileStatsPath).then(r => r.blob()).then((b) => b.text())

        setFiles(content.split('\n').filter(line => line.trim()))
      } catch (error) {
        console.error('Error loading file:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [fileStatsPath])

  const currentDirs = useMemo(() => processFiles(files, currentPath), [files, currentPath])

  const navigateToDir = (dir: string) => {
    setCurrentPath((cp) => cp + dir + '/')
  }

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(p => p)
    parts.pop()
    setCurrentPath(parts.length > 0 ? parts.join('/') + '/' : '')
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-white">
        <div className="text-center text-gray-600">
          Loading bug data...
        </div>
      </div>
    )
  }

  const command = `git log --all --pretty=format:"%H" --grep="BUGS-[0-9]" | while read commit; do
  git show --pretty="" --name-only $commit | grep -v "^test"
done > bugs.csv`;

  return (
    <div className="p-4 bg-white">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Bug Analysis by Directory</h2>

        <p>Run the following command to generate stats</p>
        <pre className="text-white bg-black p-6 rounded-xl my-2">
          <code>{command}</code>
        </pre>

        <p className="bg-sky-200 p-2 rounded-lg text-sm text-sky-900 my-2">This command lists all the files modified by commits having a message matching <code>BUGS-</code> pattern.<br/>
          <code>test/</code> directory is excluded.
        </p>

        <p>And move the generated file under <code>public/</code> directory</p>

        <div className="text-sm text-gray-600 mb-4">
          Current path: {currentPath || '/'}
          {currentPath && (
            <button
              onClick={navigateUp}
              className="ml-2 px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
            >
              Go up
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {Object.entries(currentDirs)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([name, data]) => (
            <button
              key={name}
              onClick={() => data.isDirectory && navigateToDir(name)}
              className={`text-left p-4 rounded border flex justify-between items-center ${data.isDirectory ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
            >
              <span className="text-gray-700">
                {data.isDirectory ? '📁' : '📄'} {name}
              </span>
              <span className="bg-blue-100 px-2 py-1 rounded text-sm">
                {data.count} bugs
              </span>
            </button>
          ))}
      </div>

      {Object.keys(currentDirs).length === 0 && (
        <div className="text-gray-500 italic">
          No bug fixes found in this directory
        </div>
      )}
    </div>
  )
}

export default BugExplorer