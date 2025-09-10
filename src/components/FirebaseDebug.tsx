// Debug component to test Firebase connection and Enoki auth
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export function FirebaseDebug() {
  const { user } = useAuth(); // Use Enoki user instead of Firebase auth
  const [testResult, setTestResult] = useState<string>('');

  // Remove Firebase auth listener since we're using Enoki
  // useEffect(() => {
  //   const unsubscribe = auth.onAuthStateChanged((user) => {
  //     setUser(user);
  //     console.log('Auth state changed:', user?.uid || 'No user');
  //   });
  //   return () => unsubscribe();
  // }, []);

  const testFirestore = async () => {
    try {
      setTestResult('Testing Firestore...');
      
      if (!user) {
        setTestResult('❌ No authenticated user');
        return;
      }

      const testDoc = {
        test: true,
        timestamp: new Date(),
        userId: user.uid
      };

      const docRef = await addDoc(collection(db, 'test'), testDoc);
      setTestResult(`✅ Firestore working! Doc ID: ${docRef.id}`);
    } catch (error: any) {
      setTestResult(`❌ Firestore error: ${error.message}`);
      console.error('Firestore test error:', error);
    }
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Firebase Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Auth Status:</strong> {user ? `✅ Logged in as ${user.email}` : '❌ Not logged in'}
        </div>
        
        <div>
          <strong>User ID:</strong> {user?.uid || 'None'}
        </div>

        <Button onClick={testFirestore} disabled={!user}>
          Test Firestore Write
        </Button>

        {testResult && (
          <div className="p-2 bg-gray-100 rounded">
            {testResult}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
