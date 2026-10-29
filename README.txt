AhmedML: High-Fidelity Computational Fluid Dynamics dataset for incompressible, low-speed bluff body aerodynamics
-------

version history:
---------------
12/11/2024 - added validation folder that contains the full output from all four mesh levels that were used to validate the methodology used.
04/08/2024 - updates to the file description and arxiv paper
05/06/2024 - global forces/geo added for all runs
01/05/2024 - force/moments corrected (prior version had incorrect Cs data)
18/04/2024 - draft version produced 

contact: 
----------
Neil Ashton (who can pass messages to the contributors) - contact@caemldatasets.org

website:
----------
Visit https://caemldatasets.org for the latest information on the datasets

Summary:
-------

This dataset contains 500 different geometric variations of the Ahmed Car Body - a simplified car-like shape that exhibits many of the flow topologies that are present on bluff bodies such as road vehicles. The dataset contains a wide range of geometries that exhibit fundamental flow physics such as geometry and pressure-induced flow separation of flows as well as 3D vortical structures. Each variation of the Ahmed car body were run using a time-accurate hybrid Reynolds-Averaged Navier-Stokes (RANS) - Large-Eddy Simulation (LES) turbulence modelling approach using the open-source CFD code OpenFOAM. The dataset contains both surface boundary, 3D volume, geometry STL and forces/moments in open-source formats (.vtu,.vtp). 

CFD Solver:
----------
All cases were run using the open-source finite-volume code OpenFOAM v2212. Each case was run transiently for approximately 80 convective time units (CTU) on meshes of approximately 20M cells.  Please see the paper for full details on the code and validation:

How to cite this dataset:
----------------
In order to cite the use of this dataset please cite the paper below which contains full details on the dataset. It can be found here: https://arxiv.org/abs/2407.20801

@article{ashton2024ahmed,
    title = {{AhmedML: High-Fidelity Computational Fluid Dynamics dataset for incompressible, low-speed bluff body aerodynamics}},
    year = {2024},
    journal = {arxiv.org},
    author = {Ashton, Neil and Maddix, Danielle and Gundry, Samuel and Shabestari, Parisa}
}

Files:
-------
Each folder (e.g run_1,run_2...run_"i" etc) corresponds to a different geometry that contains the following files where "i" is the run number: 
ahmed_i.stl : geometry stl (~5mb):
geo_parameters_1.csv (missing run 500): parameters that define the geometry
boundary_i.vtp : Boundary VTP (~500mb)
volume_i.vtu : Volume field VTU (~5GB)
force_mom_i.csv : forces (Cd,Cl) time-averaged with constant reference area
force_mom_varref_i.csv : forces (Cd,Cl) time-averaged with varying reference area
slices : folder containing .vtp slices in x,y,z that contain flow-field variables
images : (folder) that contains images of the following variables (CpT, UxMean) for slices of the domain in the X,Y & Z locations.
In addition we provide:
force_mom_all.csv : run, cd,cl for all runs in a single file
force_mom_varref_all.csv : run, cd,cl for all runs in a single file with varying reference area
geo_parameters_all.csv : all the geometry parameters for each run inside a single file
ahmedml.slvs : SolveSpace input file to create the parametric geometries
stl : folder containing stl files that were used as inputs
to the OpenFOAM process
openfoam-casesetup.tgz : complete OpenFOAM setup that can be used to
extend or reproduce the dataset
validation : folder containing full outputs from all four mesh levels that were used to validate the methodology

How to download:
----------------
Please ensure you have enough local disk space before downloading (complete dataset is 2TB) and consider the examples below that provide ways to download just the files you need:

First Step: Install AWS Command Line Interface (CLI):
--------------

Follow instructions here: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

Second Step: Use the AWS CLI to download the dataset
--------------
Follow the following examples for how to download all or part of the dataset.

Note 1 : If you don't have an AWS account you will need to add --no-sign-request within your AWS command i.e aws s3 cp --no-sign-request --recursive etc...
Note 2 : If you have an AWS account, please note the bucket is in us-east-1, so you will have the fastest download if you have your AWS service or EC2 instance running in us-east-1.

Example 1: Download all files (~2TB)
--------------------------
aws s3 cp --recursive s3://caemldatasets/ahmed/dataset .

Example 2: only download select files (STL,images & force and moments):
--------------------------
Create the following bash script that could be adapted to loop through only select runs or to change to download different files e.g boundary/volume.
''
#!/bin/bash

# Set the S3 bucket and prefix
S3_BUCKET="caemldatasets"
S3_PREFIX="ahmed/dataset"

# Set the local directory to download the files
LOCAL_DIR="./ahmed_data"

# Create the local directory if it doesn't exist
mkdir -p "$LOCAL_DIR"

# Loop through the run folders from 1 to 500
for i in $(seq 1 500); do
    RUN_DIR="run_$i"
    RUN_LOCAL_DIR="$LOCAL_DIR/$RUN_DIR"

    # Create the run directory if it doesn't exist
    mkdir -p "$RUN_LOCAL_DIR"

    # Download the ahmed_i.stl file
    aws s3 cp "s3://$S3_BUCKET/$S3_PREFIX/$RUN_DIR/ahmed_$i.stl" "$RUN_LOCAL_DIR/" --only-show-errors

    # Download the force_mom_i.csv file
    aws s3 cp "s3://$S3_BUCKET/$S3_PREFIX/$RUN_DIR/force_mom_$i.csv" "$RUN_LOCAL_DIR/" --only-show-errors

    aws s3 cp --recursive "s3://$S3_BUCKET/$S3_PREFIX/$RUN_DIR/images" "$RUN_LOCAL_DIR/images/" --only-show-errors
done
''

Acknowledgements
-----------
OpenFOAM solver and workflow development by Neil Ashton (Amazon Web Services)
Geometry parameterization by Samuel Gundry (Amazon Web Services) and Parisa Shabestari (Amazon Web Services)
Guidance on dataset preparation for ML by Danielle Madix (Amazon Web Services)
Simulation runs, HPC setup and dataset preparation by Neil Ashton (Amazon Web Services)

License
----
This dataset is provided under the CC BY SA 4.0 license, please see LICENSE.txt for full license text.
