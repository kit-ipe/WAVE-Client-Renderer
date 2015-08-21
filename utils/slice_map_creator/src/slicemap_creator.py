#!/usr/bin/python
# -*- coding: UTF-8 -*-

import json
import os
import re

from PIL import Image
import math

class SliceMapCreator:
    def __init__(self, config):
        self.config = config

        self.init()

    def init(self):
        # Type of image filter for slicemap
        if self.config.filter == 'n':
            self.filter_name = 'NEAREST'
            self.filter = Image.NEAREST
        elif self.config.filter == 'bl':
            self.filter = Image.BILINEAR
            self.filter_name = 'BILINEAR'
        elif self.config.filter == 'bc':
            self.filter = Image.BICUBIC
            self.filter_name = 'BICUBIC'
        elif self.config.filter == 'a':
            self.filter = Image.ANTIALIAS
            self.filter_name = 'ANTIALIAS'
        print("Filter: {0}".format(self.config.filter))

        # Path to slices
        self.path_to_slices = self.config.path_to_slices
        print("path to slices: {0}".format(self.path_to_slices))

        # Regex exp for name of slice
        self.slice_name_format = self.config.slice_name_format
        print("Slice name format: {0}".format(self.slice_name_format))
        
        # Path for slicemaps_dir
        self.path_to_slicemaps_dir = self.config.path_to_slicemaps_dir
        print("Path to slicemaps dir: {0}".format(self.path_to_slicemaps_dir))

        # Regex exp for name of slice
        self.slicemap_name_format = self.config.slicemap_name_format
        print("Slicemap name format: {0}".format(self.slicemap_name_format))

        # Path to configs dir
        self.path_to_configs_dir = self.config.path_to_configs_dir
        print("Path to configs dir: {0}".format(self.path_to_configs_dir))

        # Regex exp for name of config
        self.config_name_format = self.config.config_name_format
        print("Config name format: {0}".format(self.config_name_format))

        # Number of cols and rows
        self.row_col = self.config.row_col
        print("Row Col slicemap size: {0}".format(self.row_col))

        # Slicemap size
        self.slicemap_size = self.config.slicemap_size
        print("Slicemap size: {0}".format(self.slicemap_size))

        # Getting list of slices in the dir
        self.files_list = os.listdir(self.path_to_slices)

        def sort_slices(a, b):
            a_str_val = re.findall("[0-9]+", a[::-1])[0][::-1]
            tmp = "0";
            copy_allowed = False
            for i in range(0, len(a_str_val)):
                if a_str_val[i] != '0' or copy_allowed == True:
                    tmp += a_str_val[i]
                    copy_allowed = True

            a_str_val = tmp
            a_value = int(a_str_val)

            b_str_val = re.findall("[0-9]+", b[::-1])[0][::-1]
            tmp = "0";
            copy_allowed = False
            for i in range(0, len(b_str_val)):
                if b_str_val[i] != '0' or copy_allowed == True:
                    tmp += b_str_val[i]
                    copy_allowed = True
            b_str_val = tmp                            
            b_value = int(b_str_val)

            return a_value - b_value;

        self.files_list = sorted(self.files_list, cmp=sort_slices)

        self.slices_path_list = []
        self.slices_name_list = []
        for slice_name in self.files_list:
            path_to_slice = os.path.join(self.path_to_slices, slice_name)
            if re.match(self.slice_name_format, slice_name) and os.path.isfile(path_to_slice):
                self.slices_path_list.append(path_to_slice)
                self.slices_name_list.append(slice_name)

        # Slices range
        self.slices_range = self.config.slices_range
        self.slices_range[0] = int(self.config.slices_range[0])
        self.slices_range[1] = len(self.slices_path_list) if self.config.slices_range[1] == "*" else int(self.config.slices_range[1])
        print("Slices range: {0}".format(self.slices_range))

        # Number of slices
        self.number_of_slices = self.slices_range[1] - self.slices_range[0]
        print("Number of slices: {0}".format(self.number_of_slices))

        # Original slice size
        slice0 = Image.open(self.slices_path_list[0])
        self.original_slice_size = [slice0.size[0], slice0.size[1]]
        print("Original slice size: {0}, {1} px".format(self.original_slice_size[0], self.original_slice_size[1]))

        # Slicemap slice size
        self.slicemap_slice_size = [0,0]
        self.slicemap_slice_size[0] = self.slicemap_size[0] / self.row_col[0] if self.slicemap_size[0] % self.row_col[0] == 0 else math.ceil(self.slicemap_size[0] / self.row_col[0])
        self.slicemap_slice_size[1] = self.slicemap_size[1] / self.row_col[1] if self.slicemap_size[1] % self.row_col[1] == 0 else math.ceil(self.slicemap_size[1] / self.row_col[1])
        print("Slicemap slice size: {0}, {1} px".format(self.slicemap_slice_size[0], self.slicemap_slice_size[1]))

        # Proposional slicemap slice size
        self.proposional_slicemap_slice_size = [0,0]
        if self.original_slice_size[0] <= self.original_slice_size[1]:            
            self.proposional_slicemap_slice_size[1] = int(self.slicemap_slice_size[1])
            self.proposional_slicemap_slice_size[0] = int(math.ceil( self.slicemap_slice_size[0] * self.original_slice_size[0] / self.original_slice_size[1] ))
        else:
            self.proposional_slicemap_slice_size[0] = int(self.slicemap_slice_size[0])
            self.proposional_slicemap_slice_size[1] = int(math.ceil( self.slicemap_slice_size[1] * self.original_slice_size[1] / self.original_slice_size[0] ))
        print("Proposional slicemap slice size: {0} px".format(self.proposional_slicemap_slice_size))

        # Area of every slice for slice map
        self.area_of_slice = self.config.area_of_slice
        self.area_of_slice[0][0] = int(self.area_of_slice[0][0])
        self.area_of_slice[0][1] = int(self.area_of_slice[0][1])
        self.area_of_slice[1][0] = int(self.original_slice_size[0]) if self.area_of_slice[1][0] == "*" else int(self.area_of_slice[1][0])
        self.area_of_slice[1][1] = int(self.original_slice_size[1]) if self.area_of_slice[1][1] == "*" else int(self.area_of_slice[1][1])
        print("Area of every slice for slicemap: {0},{1} px".format(self.area_of_slice[0], self.area_of_slice[1]))

        self.slicemap_slices_number = int(self.row_col[0] * self.row_col[1])
        print("Slicemap slices number: {0}".format(self.slicemap_slices_number))

        self.slicemaps_number = int(math.ceil(float(self.number_of_slices) / float(self.slicemap_slices_number)))        
        print("Slicemaps number: {0}".format(self.slicemaps_number))

        # Path for slicemaps
        self.path_to_slicemaps = []

        for slicemap_number in range(0, self.slicemaps_number):
            self.path_to_slicemaps.append( os.path.join(self.path_to_slicemaps_dir, self.slicemap_name_format.format(slicemap_number, self.row_col[0], self.row_col[1], int(self.slicemap_size[0]), int(self.slicemap_size[1]), self.filter_name ) ) )
        print("Path to slicemaps: {0}".format(self.path_to_slicemaps))

        # Path to config
        self.path_to_config = os.path.join( self.path_to_configs_dir, self.config_name_format.format(self.row_col[0], self.row_col[1], int(self.slicemap_size[0]), int(self.slicemap_size[1]), self.filter_name ) )
        print("Path to config: {0}".format(self.path_to_config))

        print("****************************************************************************")


    def create_slicemap(self):
        # Images for slicemaps
        slicemaps_images = []

        for i in range(0, self.slicemaps_number):
            slicemap_image = Image.new('L', (int(self.slicemap_slice_size[0] * self.row_col[0]), int(self.slicemap_slice_size[0] * self.row_col[0])))
            slicemaps_images.append(slicemap_image)

        # Read files 1 by 1 from dir
        for slice_id in range(self.slices_range[0], self.slices_range[1]):
            slice_path = self.slices_path_list[slice_id]
            print("Slice path: {0}".format(slice_path))

            slice_global_order_id = int(slice_id - self.slices_range[0])
            print("Slice global order id: {0}".format(slice_global_order_id))

            slice_local_order_id = int(slice_global_order_id % self.slicemap_slices_number)
            print("Slice local order id: {0}".format(slice_local_order_id))
            
            slicemap_id = int(slice_global_order_id / self.slicemap_slices_number)
            print("Slicemap id: {0}".format(slicemap_id))

            slice_image = Image.open(slice_path)

            area_of_slice = slice_image.crop( (self.area_of_slice[0][0], self.area_of_slice[0][1], self.area_of_slice[1][0], self.area_of_slice[1][1]) )

            area_of_slice = area_of_slice.resize((self.proposional_slicemap_slice_size[0], self.proposional_slicemap_slice_size[1]), self.filter)

            slice_col_pos = int(slice_local_order_id % self.row_col[0])
            slice_row_pos = int(slice_local_order_id / self.row_col[1])

            point0 = [ int(slice_col_pos * self.slicemap_slice_size[0]), int(slice_row_pos * self.slicemap_slice_size[1]) ]
            point1 = [ int(point0[0] + area_of_slice.size[0]), int(point0[1] + area_of_slice.size[1]) ]

            print("Position: {0}\n".format( (point0[0], point0[1], point1[0], point1[1]) ))
            
            slicemaps_images[slicemap_id].paste(area_of_slice, (point0[0], point0[1], point1[0], point1[1]))

        for slicemap_number in range(0, self.slicemaps_number):
            # import pdb
            # pdb.set_trace()
            slicemaps_images[slicemap_number] = slicemaps_images[slicemap_number].resize((self.slicemap_size[0], self.slicemap_size[1] ), self.filter)
            slicemaps_images[slicemap_number].save(self.path_to_slicemaps[slicemap_number], format='PNG', progressive=True)

        print("******************************************************************")
        print("Slicemap size:                   {0},{1} px".format(self.slicemap_size[0], self.slicemap_size[1]))
        print("Number of slices:                {0}".format(self.number_of_slices))
        print("Original slice size:             {0},{1} px".format(int(self.original_slice_size[0]), int(self.original_slice_size[1])))        
        print("Slicemap slice size:             {0},{1} px".format(int(self.slicemap_slice_size[0]), int(self.slicemap_slice_size[1])))
        print("Proposional slicemap slice size: {0},{1} px".format(self.proposional_slicemap_slice_size[0], self.proposional_slicemap_slice_size[1]))
        print("Interpolation filter name:       {0}".format(self.filter_name))
        print("Number of rows and cols:         {0},{1}".format(self.row_col[0], self.row_col[1]))
        print("Path to slicemaps:               {0}".format( os.path.join(self.path_to_slicemaps_dir, self.slicemap_name_format.format('n', self.row_col[0], self.row_col[1], int(self.slicemap_size[0]), int(self.slicemap_size[1]), self.filter_name )) ))
        print("Path to slices:                  {0}".format( self.path_to_slices ))
        print("Name of fisrt slice:             {0}".format( self.files_list[0] ))
        print("Name of fisrt slicemaps:         {0}".format( self.slicemap_name_format.format(0, self.row_col[0], self.row_col[1], int(self.slicemap_size[0]), int(self.slicemap_size[1]), self.filter_name ) ))
        print("Area_of_slice:                   {0},{1} px".format(self.area_of_slice[0], self.area_of_slice[1]) )

        self.create_slicemap_config()

    def create_slicemap_config(self):
        data = {}
        data["filter"] = self.filter_name
        data["slicemaps_paths"] = [self.slicemap_name_format.format(i, self.row_col[0], self.row_col[1], int(self.slicemap_size[0]), int(self.slicemap_size[1]), self.filter_name ) for i in range(0, self.slicemaps_number)]
        data["row_col"] = self.row_col
        data["slicemap_size"] = self.slicemap_size
        data["slices_range"] = self.slices_range
        data["original_slice_size"] = self.original_slice_size
        data["volume_size"] = [self.area_of_slice[1][0] - self.area_of_slice[0][0], self.area_of_slice[1][1] - self.area_of_slice[0][1], self.slices_range[1] - self.slices_range[0]]
        data["area_of_slice"] = [self.area_of_slice[0], self.area_of_slice[1]]
        jsonString = json.dumps(data)

        print("************ CONFIG BEGIN ************ ")
        print(jsonString)
        print("************ CONFIG END ************** ")

        config_file = open(self.path_to_config, "w");
        config_file.write( jsonString )
        config_file.close()