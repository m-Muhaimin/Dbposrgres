import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Plus, User, Calendar, MapPin, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/use-realtime";
import { Navigation } from "@/components/ui/navigation";
import type { Patient, InsertPatient } from "@shared/schema";

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  room: string;
  medicalRecordNumber: string;
  admissionDate: string;
  status: string;
}

const initialFormData: PatientFormData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  room: "",
  medicalRecordNumber: "",
  admissionDate: "",
  status: "active"
};

export default function PatientManagement() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time updates
  const { isConnected } = useRealtime();
  
  // Listen for real-time patient updates
  if (typeof window !== 'undefined') {
    window.addEventListener('realtime-message', ((event: CustomEvent) => {
      const message = event.detail;
      if (message.type === "patient_update") {
        queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
    }) as EventListener);
  }

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const createPatientMutation = useMutation({
    mutationFn: async (patientData: InsertPatient) => {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
      });
      if (!response.ok) throw new Error("Failed to create patient");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setIsDialogOpen(false);
      setFormData(initialFormData);
      toast({ title: "Patient created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create patient", variant: "destructive" });
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertPatient }) => {
      const response = await fetch(`/api/patients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update patient");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setIsDialogOpen(false);
      setSelectedPatient(null);
      setFormData(initialFormData);
      setIsEditing(false);
      toast({ title: "Patient updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update patient", variant: "destructive" });
    },
  });

  const dischargePatientMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/patients/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to discharge patient");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({ title: "Patient discharged successfully" });
    },
    onError: () => {
      toast({ title: "Failed to discharge patient", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const patientData: InsertPatient = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: new Date(formData.dateOfBirth),
      gender: formData.gender,
      room: formData.room || null,
      medicalRecordNumber: formData.medicalRecordNumber,
      admissionDate: formData.admissionDate ? new Date(formData.admissionDate) : null,
      status: formData.status,
    };

    if (isEditing && selectedPatient) {
      updatePatientMutation.mutate({ id: selectedPatient.id, data: patientData });
    } else {
      createPatientMutation.mutate(patientData);
    }
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth.toISOString().split('T')[0],
      gender: patient.gender,
      room: patient.room || "",
      medicalRecordNumber: patient.medicalRecordNumber,
      admissionDate: patient.admissionDate ? patient.admissionDate.toISOString().split('T')[0] : "",
      status: patient.status,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPatient(null);
    setFormData(initialFormData);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "discharged": return "bg-gray-100 text-gray-800";
      case "transferred": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clinical-white">
      <Navigation currentPath="/patients" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Patient" : "Add New Patient"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="medicalRecordNumber">Medical Record Number</Label>
                  <Input
                    id="medicalRecordNumber"
                    value={formData.medicalRecordNumber}
                    onChange={(e) => setFormData({ ...formData, medicalRecordNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g. 204A, ICU-5"
                  />
                </div>
                <div>
                  <Label htmlFor="admissionDate">Admission Date</Label>
                  <Input
                    id="admissionDate"
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="discharged">Discharged</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={createPatientMutation.isPending || updatePatientMutation.isPending}
                >
                  {isEditing ? "Update Patient" : "Create Patient"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">
                    {patient.firstName} {patient.lastName}
                  </CardTitle>
                </div>
                <Badge className={getStatusColor(patient.status)}>
                  {patient.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Born: {formatDate(patient.dateOfBirth)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Activity className="h-4 w-4" />
                <span>MRN: {patient.medicalRecordNumber}</span>
              </div>
              {patient.room && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>Room: {patient.room}</span>
                </div>
              )}
              {patient.admissionDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Admitted: {formatDate(patient.admissionDate)}</span>
                </div>
              )}
              
              <div className="flex gap-2 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(patient)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {patient.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dischargePatientMutation.mutate(patient.id)}
                    disabled={dischargePatientMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Discharge
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {patients.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first patient</p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Patient
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}