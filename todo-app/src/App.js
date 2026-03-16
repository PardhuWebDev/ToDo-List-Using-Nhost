import { useState, useEffect } from 'react';
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient(
  'https://uigsvhsusaqndjhcecjf.hasura.ap-south-1.nhost.run/v1/graphql'
);

export default function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTodos = async () => {
    const query = gql`query { todos(order_by: { created_at: desc }) { id title is_completed } }`;
    const data = await client.request(query);
    setTodos(data.todos);
    setLoading(false);
  };

  useEffect(() => { fetchTodos(); }, []);

  const handleAdd = async () => {
    if (!newTodo.trim()) return;
    const mutation = gql`
      mutation($title: String!) {
        insert_todos_one(object: { title: $title }) { id title is_completed }
      }`;
    const data = await client.request(mutation, { title: newTodo });
    setTodos([data.insert_todos_one, ...todos]);
    setNewTodo('');
  };

  const handleToggle = async (todo) => {
    const mutation = gql`
      mutation($id: uuid!, $val: Boolean!) {
        update_todos_by_pk(pk_columns: {id: $id}, _set: {is_completed: $val}) { id is_completed }
      }`;
    await client.request(mutation, { id: todo.id, val: !todo.is_completed });
    setTodos(todos.map(t => t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t));
  };

  const handleDelete = async (id) => {
    const mutation = gql`
      mutation($id: uuid!) { delete_todos_by_pk(id: $id) { id } }`;
    await client.request(mutation, { id });
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
      <h1>📝 My Todo App</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add a new todo..."
          style={{ flex: 1, padding: 8, fontSize: 16 }}
        />
        <button onClick={handleAdd} style={{ padding: '8px 16px', fontSize: 16 }}>Add</button>
      </div>

      {loading && <p>Loading...</p>}

      {todos.map((todo) => (
        <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
          <input
            type="checkbox"
            checked={todo.is_completed}
            onChange={() => handleToggle(todo)}
          />
          <span style={{ flex: 1, textDecoration: todo.is_completed ? 'line-through' : 'none', color: todo.is_completed ? '#aaa' : '#000' }}>
            {todo.title}
          </span>
          <button onClick={() => handleDelete(todo.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
      ))}

      {!loading && todos.length === 0 && <p style={{ color: '#aaa' }}>No todos yet. Add one above!</p>}
    </div>
  );
}